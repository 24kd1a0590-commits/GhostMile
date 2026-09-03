from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import uuid
from typing import Dict, Any, Optional
from app.models import ProofUpload, ProofVerifyRequest, ShipmentStatus, ProofType
from app.auth import get_current_user
from app.database import get_db, memory_db, use_mongo

router = APIRouter(prefix="/api/proofs", tags=["Digital Proof of Delivery"])

@router.post("/pickup")
async def capture_pickup_proof(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    now = datetime.utcnow().isoformat()
    shipment_id = data.get("shipment_id")
    if not shipment_id:
        raise HTTPException(status_code=400, detail="shipment_id is required")

    proof_id = f"prf_pkw_{uuid.uuid4().hex[:8]}"
    driver_id = current_user.get("sub", "usr_driver_demo")

    doc = {
        "_id": proof_id,
        "id": proof_id,
        "shipment_id": shipment_id,
        "driver_id": driver_id,
        "type": "PICKUP",
        "image_metadata": data.get("image_metadata") or {"mode": "DEMO_CAMERA_METADATA", "captured_by": current_user.get("name", "Driver")},
        "photo_url": data.get("photo_url") or "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
        "timestamp": now,
        "verification_status": "VERIFIED"
    }

    if use_mongo:
        await db.delivery_proofs.insert_one(doc)
        await db.shipments.update_one({"_id": shipment_id}, {"$set": {"status": ShipmentStatus.PICKED_UP, "updated_at": now}})
    else:
        memory_db.delivery_proofs[proof_id] = doc
        if shipment_id in memory_db.shipments:
            memory_db.shipments[shipment_id]["status"] = ShipmentStatus.PICKED_UP
            memory_db.shipments[shipment_id]["updated_at"] = now

    return {
        "status": "success",
        "proof_id": proof_id,
        "type": "PICKUP",
        "new_shipment_status": ShipmentStatus.PICKED_UP,
        "timestamp": now
    }

@router.post("/delivery")
async def capture_delivery_proof(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    now = datetime.utcnow().isoformat()
    shipment_id = data.get("shipment_id")
    if not shipment_id:
        raise HTTPException(status_code=400, detail="shipment_id is required")

    proof_id = f"prf_del_{uuid.uuid4().hex[:8]}"
    driver_id = current_user.get("sub", "usr_driver_demo")
    verification_code = f"RN-QR-{uuid.uuid4().hex[:6].upper()}"

    doc = {
        "_id": proof_id,
        "id": proof_id,
        "shipment_id": shipment_id,
        "driver_id": driver_id,
        "type": "DELIVERY",
        "image_metadata": data.get("image_metadata") or {"mode": "DEMO_CAMERA_METADATA", "captured_by": current_user.get("name", "Driver")},
        "photo_url": data.get("photo_url") or "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=600&q=80",
        "verification_code": verification_code,
        "timestamp": now,
        "verification_status": "PENDING_QR"
    }

    if use_mongo:
        await db.delivery_proofs.insert_one(doc)
        await db.shipments.update_one({"_id": shipment_id}, {"$set": {"status": ShipmentStatus.ARRIVED, "updated_at": now}})
    else:
        memory_db.delivery_proofs[proof_id] = doc
        if shipment_id in memory_db.shipments:
            memory_db.shipments[shipment_id]["status"] = ShipmentStatus.ARRIVED
            memory_db.shipments[shipment_id]["updated_at"] = now

    return {
        "status": "success",
        "proof_id": proof_id,
        "type": "DELIVERY",
        "verification_code": verification_code,
        "new_shipment_status": ShipmentStatus.ARRIVED,
        "timestamp": now
    }

@router.post("/verify")
async def verify_delivery_proof(
    data: ProofVerifyRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    now = datetime.utcnow().isoformat()
    shipment_id = data.shipment_id

    # Update proof status and shipment status to DELIVERED & PAYMENT_RELEASED
    if use_mongo:
        await db.delivery_proofs.update_many({"shipment_id": shipment_id}, {"$set": {"verification_status": "VERIFIED"}})
        await db.shipments.update_one({"_id": shipment_id}, {"$set": {"status": ShipmentStatus.PAYMENT_RELEASED, "updated_at": now}})
    else:
        for p in memory_db.delivery_proofs.values():
            if p.get("shipment_id") == shipment_id:
                p["verification_status"] = "VERIFIED"
        if shipment_id in memory_db.shipments:
            memory_db.shipments[shipment_id]["status"] = ShipmentStatus.PAYMENT_RELEASED
            memory_db.shipments[shipment_id]["updated_at"] = now

    return {
        "status": "success",
        "shipment_id": shipment_id,
        "verification_status": "VERIFIED",
        "new_shipment_status": ShipmentStatus.PAYMENT_RELEASED,
        "escrow_released": True,
        "timestamp": now
    }

@router.post("")
async def general_upload_proof(
    proof: ProofUpload,
    current_user: dict = Depends(get_current_user)
):
    stage = (proof.stage or "delivery").lower()
    if stage == "pickup":
        return await capture_pickup_proof({"shipment_id": proof.shipment_id, "photo_url": proof.photo_url, "image_metadata": proof.image_metadata}, current_user)
    else:
        return await capture_delivery_proof({"shipment_id": proof.shipment_id, "photo_url": proof.photo_url, "image_metadata": proof.image_metadata}, current_user)
