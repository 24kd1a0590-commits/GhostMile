from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import uuid
from typing import Dict, Any, Optional
from app.models import PaymentEscrowRequest, PaymentReleaseRequest, PaymentRecord, PaymentStatus, ShipmentStatus
from app.auth import get_current_user
from app.database import get_db, memory_db, use_mongo

router = APIRouter(prefix="/api/payments", tags=["Demo Escrow & Payment Lifecycle"])

DEMO_DISCLAIMER = "DEMO PAYMENT — No real money transferred"

@router.post("/escrow")
async def initiate_demo_escrow(
    req: PaymentEscrowRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    now = datetime.utcnow().isoformat()
    txn_id = f"TXN-RN-{uuid.uuid4().hex[:6].upper()}"

    doc = {
        "_id": txn_id,
        "transaction_id": txn_id,
        "shipment_id": req.shipment_id,
        "shipper_id": current_user.get("sub"),
        "amount_inr": req.amount_inr,
        "status": PaymentStatus.ESCROW_HELD,
        "created_at": now,
        "released_at": None,
        "disclaimer": DEMO_DISCLAIMER
    }

    if use_mongo:
        await db.payments.insert_one(doc)
    else:
        memory_db.payments[txn_id] = doc

    return {
        "status": PaymentStatus.ESCROW_HELD,
        "transaction_id": txn_id,
        "shipment_id": req.shipment_id,
        "amount_inr": req.amount_inr,
        "disclaimer": DEMO_DISCLAIMER,
        "message": f"🛡 Demo Escrow Protected — ₹{req.amount_inr} Held Securely"
    }

@router.post("/release")
async def release_demo_escrow(
    req: Optional[PaymentReleaseRequest] = None,
    shipment_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    target_shipment_id = req.shipment_id if req else shipment_id
    if not target_shipment_id:
        raise HTTPException(status_code=400, detail="shipment_id is required")

    db = get_db()
    now = datetime.utcnow().isoformat()
    found_payment = None

    if use_mongo:
        found_payment = await db.payments.find_one({"shipment_id": target_shipment_id, "status": PaymentStatus.ESCROW_HELD})
        if not found_payment:
            found_payment = await db.payments.find_one({"shipment_id": target_shipment_id})

        if found_payment:
            await db.payments.update_one({"_id": found_payment["_id"]}, {"$set": {"status": PaymentStatus.RELEASED, "released_at": now}})
        await db.shipments.update_one({"_id": target_shipment_id}, {"$set": {"status": ShipmentStatus.PAYMENT_RELEASED, "updated_at": now}})
    else:
        for p in memory_db.payments.values():
            if p.get("shipment_id") == target_shipment_id:
                found_payment = p
                p["status"] = PaymentStatus.RELEASED
                p["released_at"] = now
                break
        if target_shipment_id in memory_db.shipments:
            memory_db.shipments[target_shipment_id]["status"] = ShipmentStatus.PAYMENT_RELEASED
            memory_db.shipments[target_shipment_id]["updated_at"] = now

    txn_id = found_payment.get("transaction_id") if found_payment else f"TXN-RN-{uuid.uuid4().hex[:6].upper()}"
    amount = found_payment.get("amount_inr") if found_payment else 1850.0

    return {
        "status": PaymentStatus.RELEASED,
        "transaction_id": txn_id,
        "shipment_id": target_shipment_id,
        "amount_released_inr": amount,
        "disclaimer": DEMO_DISCLAIMER,
        "timestamp": now,
        "message": f"✓ Delivery Verified — ₹{amount} Payment Released"
    }

@router.get("/{shipment_id}")
async def get_payment_details(
    shipment_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    found_payment = None

    if use_mongo:
        found_payment = await db.payments.find_one({"shipment_id": shipment_id})
    else:
        for p in memory_db.payments.values():
            if p.get("shipment_id") == shipment_id:
                found_payment = p
                break

    if not found_payment:
        # Generate default pending payment state for demo
        txn_id = f"TXN-RN-{uuid.uuid4().hex[:6].upper()}"
        return {
            "transaction_id": txn_id,
            "shipment_id": shipment_id,
            "amount_inr": 1850.0,
            "status": PaymentStatus.ESCROW_HELD,
            "created_at": datetime.utcnow().isoformat(),
            "released_at": None,
            "disclaimer": DEMO_DISCLAIMER
        }

    return {
        "transaction_id": found_payment.get("transaction_id", found_payment.get("id")),
        "shipment_id": found_payment.get("shipment_id"),
        "amount_inr": found_payment.get("amount_inr", 1850.0),
        "status": found_payment.get("status", PaymentStatus.ESCROW_HELD),
        "created_at": found_payment.get("created_at"),
        "released_at": found_payment.get("released_at"),
        "disclaimer": DEMO_DISCLAIMER
    }
