from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime
import uuid
from app.models import ShipmentCreate, ShipmentUpdate, ShipmentResponse, ShipmentStatus, UserRole, Location
from app.auth import get_current_user, require_role
from app.database import get_db, memory_db, use_mongo

router = APIRouter(prefix="/api/shipments", tags=["Shipments"])

def format_shipment_doc(s: dict) -> dict:
    """Helper to ensure backward compatibility and dictionary formatting."""
    name_val = s.get("name") or s.get("title") or "Rural Freight Shipment"
    weight_val = s.get("weight") if s.get("weight") is not None else s.get("weight_kg", 50.0)
    price_val = s.get("offered_price") if s.get("offered_price") is not None else s.get("offered_price_inr", 1500.0)

    p_loc_str = s.get("pickup_location")
    if isinstance(p_loc_str, dict):
        p_loc_str = p_loc_str.get("address_name", "Pickup Hub")
    elif not p_loc_str:
        p_loc_str = "Pickup Hub"

    d_loc_str = s.get("destination") or s.get("destination_location")
    if isinstance(d_loc_str, dict):
        d_loc_str = d_loc_str.get("address_name", "Destination Hub")
    elif not d_loc_str:
        d_loc_str = "Destination Hub"

    p_coords = s.get("pickup_coordinates") or s.get("pickup_location")
    if not isinstance(p_coords, dict):
        p_coords = {"lat": 12.9716, "lng": 77.5946, "address_name": p_loc_str}

    d_coords = s.get("destination_coordinates") or s.get("destination_location")
    if not isinstance(d_coords, dict):
        d_coords = {"lat": 12.5218, "lng": 76.8951, "address_name": d_loc_str}

    return {
        "id": s.get("id") or str(s.get("_id")),
        "shipper_id": s.get("shipper_id", "demo_shipper"),
        "shipper_name": s.get("shipper_name", "Rural Producer"),
        "driver_id": s.get("driver_id"),
        "driver_name": s.get("driver_name"),
        "name": name_val,
        "title": name_val,
        "description": s.get("description", ""),
        "package_type": s.get("package_type", "Standard Box"),
        "weight": weight_val,
        "weight_kg": weight_val,
        "pickup_location": p_loc_str,
        "destination": d_loc_str,
        "pickup_coordinates": p_coords,
        "destination_coordinates": d_coords,
        "offered_price": price_val,
        "offered_price_inr": price_val,
        "priority": s.get("priority", "MEDIUM"),
        "status": s.get("status", "AVAILABLE"),
        "match_score": s.get("match_score"),
        "match_reasons": s.get("match_reasons", []),
        "created_at": s.get("created_at", datetime.utcnow().isoformat()),
        "updated_at": s.get("updated_at", datetime.utcnow().isoformat())
    }

@router.post("", response_model=ShipmentResponse)
async def create_shipment(
    shipment: ShipmentCreate,
    current_user: dict = Depends(require_role([UserRole.SHIPPER, UserRole.ADMIN]))
):
    db = get_db()
    shipment_id = f"shp_{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()

    doc = {
        "_id": shipment_id,
        "id": shipment_id,
        "shipper_id": current_user.get("sub", "demo_shipper"),
        "shipper_name": current_user.get("name", "Rural Agri Producer"),
        "driver_id": None,
        "driver_name": None,
        "name": shipment.name,
        "title": shipment.name,
        "description": shipment.description or "",
        "package_type": shipment.package_type,
        "weight": shipment.weight,
        "weight_kg": shipment.weight,
        "pickup_location": shipment.pickup_location,
        "destination": shipment.destination,
        "pickup_coordinates": shipment.pickup_coordinates.model_dump(),
        "destination_coordinates": shipment.destination_coordinates.model_dump(),
        "offered_price": shipment.offered_price,
        "offered_price_inr": shipment.offered_price,
        "priority": shipment.priority,
        "status": ShipmentStatus.AVAILABLE,
        "created_at": now,
        "updated_at": now
    }

    if use_mongo:
        await db.shipments.insert_one(doc)
    else:
        memory_db.shipments[shipment_id] = doc

    return ShipmentResponse(**format_shipment_doc(doc))

@router.get("", response_model=List[ShipmentResponse])
async def list_shipments(
    status: Optional[ShipmentStatus] = None,
    shipper_id: Optional[str] = None,
    driver_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    results = []

    if use_mongo:
        query = {}
        if status:
            query["status"] = status
        if shipper_id:
            query["shipper_id"] = shipper_id
        if driver_id:
            query["driver_id"] = driver_id
            
        cursor = db.shipments.find(query).sort("created_at", -1)
        async for s in cursor:
            results.append(ShipmentResponse(**format_shipment_doc(s)))
    else:
        for s in memory_db.shipments.values():
            if status and s["status"] != status:
                continue
            if shipper_id and s.get("shipper_id") != shipper_id:
                continue
            if driver_id and s.get("driver_id") != driver_id:
                continue
            results.append(ShipmentResponse(**format_shipment_doc(s)))

    return results

@router.get("/{shipment_id}", response_model=ShipmentResponse)
async def get_shipment(shipment_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    s = None
    if use_mongo:
        s = await db.shipments.find_one({"_id": shipment_id})
    else:
        s = memory_db.shipments.get(shipment_id)

    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")

    return ShipmentResponse(**format_shipment_doc(s))

@router.put("/{shipment_id}", response_model=ShipmentResponse)
async def update_shipment(
    shipment_id: str,
    update_data: ShipmentUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    now = datetime.utcnow().isoformat()

    target = None
    if use_mongo:
        target = await db.shipments.find_one({"_id": shipment_id})
    else:
        target = memory_db.shipments.get(shipment_id)

    if not target:
        raise HTTPException(status_code=404, detail="Shipment not found")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = now

    if "name" in update_dict:
        update_dict["title"] = update_dict["name"]
    if "weight" in update_dict:
        update_dict["weight_kg"] = update_dict["weight"]
    if "offered_price" in update_dict:
        update_dict["offered_price_inr"] = update_dict["offered_price"]

    if use_mongo:
        await db.shipments.update_one({"_id": shipment_id}, {"$set": update_dict})
        target.update(update_dict)
    else:
        memory_db.shipments[shipment_id].update(update_dict)
        target = memory_db.shipments[shipment_id]

    return ShipmentResponse(**format_shipment_doc(target))

@router.delete("/{shipment_id}")
async def delete_shipment(
    shipment_id: str,
    current_user: dict = Depends(require_role([UserRole.SHIPPER, UserRole.ADMIN]))
):
    db = get_db()

    target = None
    if use_mongo:
        target = await db.shipments.find_one({"_id": shipment_id})
    else:
        target = memory_db.shipments.get(shipment_id)

    if not target:
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Verify ownership or admin role
    if current_user.get("role") != "admin" and target.get("shipper_id") != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="Not authorized to delete this shipment")

    if target.get("status") in [ShipmentStatus.DELIVERED, ShipmentStatus.PAYMENT_RELEASED]:
        raise HTTPException(status_code=400, detail="Cannot delete completed shipments")

    if use_mongo:
        await db.shipments.delete_one({"_id": shipment_id})
    else:
        memory_db.shipments.pop(shipment_id, None)

    return {"status": "success", "message": f"Shipment {shipment_id} deleted successfully"}

@router.post("/{shipment_id}/accept", response_model=ShipmentResponse)
async def accept_shipment(
    shipment_id: str,
    current_user: dict = Depends(require_role([UserRole.DRIVER, UserRole.ADMIN]))
):
    db = get_db()
    now = datetime.utcnow().isoformat()
    driver_id = current_user.get("sub", "demo_driver")
    driver_name = current_user.get("name", "Demo Driver")

    target = None
    if use_mongo:
        target = await db.shipments.find_one({"_id": shipment_id})
    else:
        target = memory_db.shipments.get(shipment_id)

    if not target:
        raise HTTPException(status_code=404, detail="Shipment not found")

    update_fields = {
        "status": ShipmentStatus.ACCEPTED,
        "driver_id": driver_id,
        "driver_name": driver_name,
        "updated_at": now
    }

    if use_mongo:
        await db.shipments.update_one({"_id": shipment_id}, {"$set": update_fields})
        target.update(update_fields)
    else:
        memory_db.shipments[shipment_id].update(update_fields)
        target = memory_db.shipments[shipment_id]

    return ShipmentResponse(**format_shipment_doc(target))
