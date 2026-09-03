from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import uuid
from app.models import PaymentEscrow, ShipmentStatus
from app.auth import get_current_user
from app.database import get_db, memory_db, use_mongo

router = APIRouter(prefix="/api/payments", tags=["Demo Escrow System"])

@router.post("/escrow")
async def initiate_escrow(escrow: PaymentEscrow, current_user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.utcnow().isoformat()
    payment_id = f"esc_{uuid.uuid4().hex[:8]}"

    doc = {
        "_id": payment_id,
        "id": payment_id,
        "shipment_id": escrow.shipment_id,
        "amount_inr": escrow.amount_inr,
        "status": "HELD_IN_ESCROW",
        "created_at": now,
        "released_at": None
    }

    if use_mongo:
        await db.payments.insert_one(doc)
    else:
        memory_db.payments[payment_id] = doc

    return {"status": "HELD_IN_ESCROW", "escrow_id": payment_id, "amount_inr": escrow.amount_inr, "note": "Demo Escrow Secured"}

@router.post("/release")
async def release_escrow(shipment_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.utcnow().isoformat()

    found = None
    if use_mongo:
        found = await db.payments.find_one({"shipment_id": shipment_id, "status": "HELD_IN_ESCROW"})
        if found:
            await db.payments.update_one({"_id": found["_id"]}, {"$set": {"status": "RELEASED", "released_at": now}})
            await db.shipments.update_one({"_id": shipment_id}, {"$set": {"status": ShipmentStatus.PAYMENT_RELEASED, "updated_at": now}})
    else:
        for p in memory_db.payments.values():
            if p["shipment_id"] == shipment_id and p["status"] == "HELD_IN_ESCROW":
                found = p
                p["status"] = "RELEASED"
                p["released_at"] = now
                break
        if shipment_id in memory_db.shipments:
            memory_db.shipments[shipment_id]["status"] = ShipmentStatus.PAYMENT_RELEASED
            memory_db.shipments[shipment_id]["updated_at"] = now

    amount = found["amount_inr"] if found else 1850.0

    return {
        "status": "PAYMENT_RELEASED",
        "shipment_id": shipment_id,
        "amount_released_inr": amount,
        "payout_type": "Instant UPI Transfer (Demo)",
        "timestamp": now
    }
