from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import uuid
from app.models import ProofUpload, ShipmentStatus
from app.auth import get_current_user
from app.database import get_db, memory_db, use_mongo

router = APIRouter(prefix="/api/proofs", tags=["Digital Proof of Delivery"])

@router.post("")
async def upload_proof(proof: ProofUpload, current_user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.utcnow().isoformat()
    proof_id = f"prf_{uuid.uuid4().hex[:8]}"

    doc = {
        "_id": proof_id,
        "id": proof_id,
        "shipment_id": proof.shipment_id,
        "stage": proof.stage.upper(),
        "photo_url": proof.photo_url,
        "verifier_name": proof.verifier_name or current_user.get("name", "Driver"),
        "verification_code": proof.verification_code or f"QR-{uuid.uuid4().hex[:6].upper()}",
        "uploaded_at": now
    }

    if use_mongo:
        await db.delivery_proofs.insert_one(doc)
    else:
        memory_db.delivery_proofs[proof_id] = doc

    # Automatically advance shipment status
    new_status = ShipmentStatus.PICKED_UP if proof.stage.upper() == "PICKUP" else ShipmentStatus.DELIVERED
    
    if use_mongo:
        await db.shipments.update_one({"_id": proof.shipment_id}, {"$set": {"status": new_status, "updated_at": now}})
    elif proof.shipment_id in memory_db.shipments:
        memory_db.shipments[proof.shipment_id]["status"] = new_status
        memory_db.shipments[proof.shipment_id]["updated_at"] = now

    return {"status": "success", "proof_id": proof_id, "stage": proof.stage, "new_shipment_status": new_status}
