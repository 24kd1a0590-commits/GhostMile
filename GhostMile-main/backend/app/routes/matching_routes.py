from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.models import DriverRouteUpdate, MatchResult, ShipmentResponse, UserRole
from app.services.matching_engine import evaluate_match
from app.auth import get_current_user, require_role
from app.database import get_db, memory_db, use_mongo
from app.routes.shipment_routes import format_shipment_doc

router = APIRouter(prefix="/api/matches", tags=["RouteNova Smart Matching Engine"])

def sort_match_results(results: List[dict], sort_by: str) -> List[dict]:
    """Sort matching results by selected criteria."""
    if sort_by == "earnings":
        return sorted(results, key=lambda x: x["estimated_earnings"], reverse=True)
    elif sort_by == "detour":
        return sorted(results, key=lambda x: x["estimated_detour_km"])
    elif sort_by == "priority":
        priority_weights = {"URGENT": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        return sorted(results, key=lambda x: priority_weights.get((x["shipment"].get("priority") or "MEDIUM").upper(), 0), reverse=True)
    else:  # match_score default
        return sorted(results, key=lambda x: x["match_score"], reverse=True)

@router.get("")
async def get_matches(
    curr_lat: float = Query(12.9716, description="Driver current latitude"),
    curr_lng: float = Query(77.5946, description="Driver current longitude"),
    dest_lat: float = Query(12.5218, description="Driver destination latitude"),
    dest_lng: float = Query(76.8951, description="Driver destination longitude"),
    available_capacity: float = Query(400.0, description="Available truck capacity in kg"),
    truck_capacity: float = Query(500.0, description="Total truck capacity in kg"),
    sort_by: Optional[str] = Query("match_score", description="Sort by: match_score, earnings, detour, priority"),
    current_user: dict = Depends(require_role([UserRole.DRIVER, UserRole.ADMIN]))
):
    db = get_db()
    available_shipments = []

    if use_mongo:
        cursor = db.shipments.find({"status": "AVAILABLE"})
        async for s in cursor:
            available_shipments.append(format_shipment_doc(s))
    else:
        for s in memory_db.shipments.values():
            if s["status"] == "AVAILABLE":
                available_shipments.append(format_shipment_doc(s))

    driver_data = {
        "current_location": {"lat": curr_lat, "lng": curr_lng},
        "destination": {"lat": dest_lat, "lng": dest_lng},
        "truck_capacity": truck_capacity,
        "available_capacity": available_capacity
    }

    results = []
    for shp in available_shipments:
        eval_data = evaluate_match(driver_data, shp)
        item = {
            "shipment": shp,
            "match_score": eval_data["match_score"],
            "recommendation": eval_data["recommendation"],
            "reason": eval_data["reason"],
            "estimated_detour_km": eval_data["estimated_detour_km"],
            "estimated_earnings": eval_data["estimated_earnings"],
            "fuel_saved_liters": eval_data["fuel_saved_liters"],
            "co2_saved_kg": eval_data["co2_saved_kg"],
            "capacity_used_pct": eval_data["capacity_used_pct"],
            "route_score": eval_data["route_score"],
            "capacity_score": eval_data["capacity_score"],
            "distance_score": eval_data["distance_score"],
            "priority_score": eval_data["priority_score"],
            "timing_score": eval_data["timing_score"]
        }
        results.append(item)

    sorted_results = sort_match_results(results, sort_by or "match_score")
    return sorted_results

@router.post("")
async def compute_matches_post(
    route_info: DriverRouteUpdate,
    sort_by: Optional[str] = Query("match_score"),
    current_user: dict = Depends(require_role([UserRole.DRIVER, UserRole.ADMIN]))
):
    return await get_matches(
        curr_lat=route_info.origin.lat,
        curr_lng=route_info.origin.lng,
        dest_lat=route_info.destination.lat,
        dest_lng=route_info.destination.lng,
        available_capacity=route_info.available_capacity_kg,
        truck_capacity=route_info.max_capacity_kg,
        sort_by=sort_by,
        current_user=current_user
    )
