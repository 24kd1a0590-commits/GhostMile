from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
import uuid
from app.models import UserRegister, UserLogin, Token, UserProfile, UserRole
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.database import get_db, memory_db, use_mongo

router = APIRouter(prefix="/api", tags=["Authentication"])

@router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    db = get_db()
    email_clean = user_data.email.lower().strip()
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    created_at = datetime.utcnow().isoformat()
    hashed_pwd = hash_password(user_data.password)

    user_doc = {
        "_id": user_id,
        "id": user_id,
        "name": user_data.name,
        "email": email_clean,
        "phone": user_data.phone,
        "password": hashed_pwd,
        "role": user_data.role,
        "vehicle_type": user_data.vehicle_type,
        "vehicle_capacity_kg": user_data.vehicle_capacity_kg,
        "created_at": created_at
    }

    if use_mongo:
        existing = await db.users.find_one({"email": email_clean})
        if existing:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        await db.users.insert_one(user_doc)
    else:
        for existing in memory_db.users.values():
            if existing["email"] == email_clean:
                raise HTTPException(status_code=400, detail="User with this email already exists")
        memory_db.users[user_id] = user_doc

    token = create_access_token({
        "sub": user_id,
        "role": user_data.role,
        "email": email_clean,
        "name": user_data.name
    })

    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user_id,
        role=user_data.role,
        name=user_data.name,
        email=email_clean
    )

@router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    db = get_db()
    email_clean = credentials.email.lower().strip()

    target_user = None
    if use_mongo:
        target_user = await db.users.find_one({"email": email_clean})
    else:
        for u in memory_db.users.values():
            if u["email"] == email_clean:
                target_user = u
                break

    if not target_user or not verify_password(credentials.password, target_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "sub": target_user["id"],
        "role": target_user["role"],
        "email": target_user["email"],
        "name": target_user["name"]
    })

    return Token(
        access_token=token,
        token_type="bearer",
        user_id=target_user["id"],
        role=target_user["role"],
        name=target_user["name"],
        email=target_user["email"]
    )

@router.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Acknowledge logout on backend."""
    return {"status": "success", "message": "Logged out successfully"}

@router.get("/users/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    db = get_db()

    target = None
    if use_mongo:
        target = await db.users.find_one({"_id": user_id})
    else:
        target = memory_db.users.get(user_id)

    if not target:
        return UserProfile(
            id=user_id,
            name=current_user.get("name", "Demo User"),
            email=current_user.get("email", "demo@routenova.in"),
            phone="+91 9876543210",
            role=current_user.get("role", UserRole.DRIVER),
            vehicle_type="Light Commercial Truck",
            vehicle_capacity_kg=500.0,
            created_at=datetime.utcnow().isoformat()
        )

    return UserProfile(
        id=target["id"],
        name=target["name"],
        email=target["email"],
        phone=target["phone"],
        role=target["role"],
        vehicle_type=target.get("vehicle_type"),
        vehicle_capacity_kg=target.get("vehicle_capacity_kg", 500.0),
        created_at=target.get("created_at", datetime.utcnow().isoformat())
    )
