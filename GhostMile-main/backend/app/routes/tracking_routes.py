from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from app.models import TrackingPing, TrackingState, Location
from app.auth import get_current_user
from app.database import get_db, memory_db, use_mongo
from app.services.matching_engine import haversine_distance

router = APIRouter(prefix="/api/tracking", tags=["Real-Time Tracking Engine"])

@router.post("")
async def post_tracking_ping(
    ping: TrackingPing,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    now = datetime.utcnow().isoformat()
    driver_id = ping.driver_id or current_user.get("sub", "demo_driver")

    ping_data = {
        "shipment_id": ping.shipment_id,
        "driver_id": driver_id,
        "latitude": ping.latitude,
        "longitude": ping.longitude,
        "lat": ping.lat,
        "lng": ping.lng,
        "speed": ping.speed,
        "speed_kmh": ping.speed_kmh,
        "is_demo": ping.is_demo,
        "timestamp": ping.timestamp or now
    }

    if use_mongo:
        await db.tracking.insert_one(ping_data)
    else:
        if ping.shipment_id not in memory_db.tracking:
            memory_db.tracking[ping.shipment_id] = []
        memory_db.tracking[ping.shipment_id].append(ping_data)

    return {"status": "success", "shipment_id": ping.shipment_id, "timestamp": now}

@router.get("/{shipment_id}", response_model=TrackingState)
async def get_tracking_state(
    shipment_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()

    shp = None
    if use_mongo:
        shp = await db.shipments.find_one({"_id": shipment_id})
    else:
        shp = memory_db.shipments.get(shipment_id)

    if not shp:
        raise HTTPException(status_code=404, detail="Shipment not found")

    dest_coords = shp.get("destination_coordinates") or shp.get("destination_location") or {"lat": 12.5218, "lng": 76.8951}
    dest_lat = dest_coords["lat"]
    dest_lng = dest_coords["lng"]

    pings = []
    if use_mongo:
        cursor = db.tracking.find({"shipment_id": shipment_id}).sort("timestamp", 1)
        async for p in cursor:
            pings.append(p)
    else:
        pings = memory_db.tracking.get(shipment_id, [])

    if not pings:
        p_coords = shp.get("pickup_coordinates") or shp.get("pickup_location") or {"lat": 12.9716, "lng": 77.5946}
        curr_loc = Location(
            lat=p_coords["lat"],
            lng=p_coords["lng"],
            address_name=shp.get("pickup_location") if isinstance(shp.get("pickup_location"), str) else "Pickup Hub"
        )
        path_history = [curr_loc]
        last_updated = datetime.utcnow().isoformat()
        speed_kmh = 0.0
        is_demo = True
    else:
        latest = pings[-1]
        curr_loc = Location(lat=latest["lat"], lng=latest["lng"])
        path_history = [Location(lat=p["lat"], lng=p["lng"]) for p in pings]
        last_updated = latest["timestamp"]
        speed_kmh = float(latest.get("speed_kmh") or latest.get("speed") or 40.0)
        is_demo = bool(latest.get("is_demo", True))

    dist_rem = round(haversine_distance(curr_loc.lat, curr_loc.lng, dest_lat, dest_lng), 1)
    speed_eff = max(speed_kmh, 30.0)  # Avoid div by zero
    eta_mins = max(1, int((dist_rem / speed_eff) * 60))

    dest_loc = Location(
        lat=dest_lat,
        lng=dest_lng,
        address_name=shp.get("destination") if isinstance(shp.get("destination"), str) else "Destination Hub"
    )

    return TrackingState(
        shipment_id=shipment_id,
        driver_id=shp.get("driver_id"),
        driver_name=shp.get("driver_name"),
        current_location=curr_loc,
        destination_location=dest_loc,
        distance_remaining_km=dist_rem,
        eta_minutes=eta_mins,
        speed_kmh=speed_kmh,
        path_history=path_history,
        is_demo=is_demo,
        last_updated=last_updated
    )
