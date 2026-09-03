import math
from typing import Dict, Any, List, Tuple

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the Great Circle distance between two points in kilometers."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def distance_to_segment(p_lat: float, p_lng: float, a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    """Approximate distance in km from point P to line segment AB."""
    # Convert lat/lng to approximate flat projection (km offset)
    deg_to_km_lat = 111.0
    deg_to_km_lng = 111.0 * math.cos(math.radians((a_lat + b_lat) / 2))
    
    px = (p_lng - a_lng) * deg_to_km_lng
    py = (p_lat - a_lat) * deg_to_km_lat
    
    bx = (b_lng - a_lng) * deg_to_km_lng
    by = (b_lat - a_lat) * deg_to_km_lat
    
    segment_len_sq = bx * bx + by * by
    if segment_len_sq == 0:
        return math.sqrt(px * px + py * py)
    
    # Project point onto segment
    t = max(0.0, min(1.0, (px * bx + py * by) / segment_len_sq))
    proj_x = t * bx
    proj_y = t * by
    
    dx = px - proj_x
    dy = py - proj_y
    return math.sqrt(dx * dx + dy * dy)

def calculate_match_score(
    shipment: Dict[str, Any],
    driver_origin: Dict[str, float],
    driver_destination: Dict[str, float],
    driver_available_cap: float,
    driver_max_cap: float = 500.0
) -> Dict[str, Any]:
    """
    Smart Matching Engine algorithm implementing multi-factor scoring:
    match_score = 0.35 * route_score + 0.25 * capacity_score + 0.20 * distance_score + 0.10 * priority_score + 0.10 * timing_score
    """
    p_lat = shipment["pickup_location"]["lat"]
    p_lng = shipment["pickup_location"]["lng"]
    d_lat = shipment["destination_location"]["lat"]
    d_lng = shipment["destination_location"]["lng"]

    dr_o_lat = driver_origin["lat"]
    dr_o_lng = driver_origin["lng"]
    dr_d_lat = driver_destination["lat"]
    dr_d_lng = driver_destination["lng"]

    # 1. Route Score (0.0 to 1.0)
    pickup_dev = distance_to_segment(p_lat, p_lng, dr_o_lat, dr_o_lng, dr_d_lat, dr_d_lng)
    dropoff_dev = distance_to_segment(d_lat, d_lng, dr_o_lat, dr_o_lng, dr_d_lat, dr_d_lng)
    avg_dev = (pickup_dev + dropoff_dev) / 2.0
    route_score = max(0.0, 1.0 - (avg_dev / 25.0))  # 25km corridor buffer

    # 2. Capacity Score (0.0 to 1.0)
    weight = shipment.get("weight_kg", 50.0)
    if weight > driver_available_cap:
        capacity_score = 0.0
    else:
        # Higher score if load efficiently uses remaining capacity without overflowing
        cap_utilization = weight / driver_max_cap
        capacity_score = min(1.0, 0.8 + cap_utilization * 0.2)

    # 3. Distance Score (0.0 to 1.0)
    pickup_dist = haversine_distance(dr_o_lat, dr_o_lng, p_lat, p_lng)
    distance_score = max(0.0, 1.0 - (pickup_dist / 35.0))  # Proximity to pickup point

    # 4. Priority Score (0.0 to 1.0)
    priority_map = {"URGENT": 1.0, "HIGH": 0.85, "MEDIUM": 0.70, "LOW": 0.50}
    priority_score = priority_map.get(shipment.get("priority", "MEDIUM"), 0.70)

    # 5. Timing Score (0.0 to 1.0)
    timing_score = 0.90  # Default optimal time window alignment

    # Weighted Score Formula
    raw_score = (
        0.35 * route_score +
        0.25 * capacity_score +
        0.20 * distance_score +
        0.10 * priority_score +
        0.10 * timing_score
    )

    final_score = round(raw_score * 100.0, 1)

    # Generate Human-Readable Explanations
    reasons = []
    if avg_dev <= 5.0:
        reasons.append(f"Direct Highway Corridor: Pick-up & drop-off within {round(avg_dev, 1)}km of your planned route.")
    elif avg_dev <= 15.0:
        reasons.append(f"Minor Detour: Minor {round(avg_dev, 1)}km deviation from primary highway corridor.")

    if capacity_score > 0:
        pct = round((weight / driver_max_cap) * 100)
        reasons.append(f"Payload Fit: Weight ({weight}kg) occupies {pct}% of your available payload capacity.")
    else:
        reasons.append(f"Capacity Warning: Weight ({weight}kg) exceeds current truck remaining limit.")

    if pickup_dist <= 10.0:
        reasons.append(f"Nearby Pickup: Pickup site is only {round(pickup_dist, 1)}km from your starting point.")

    if shipment.get("priority") in ["HIGH", "URGENT"]:
        reasons.append("High Priority Load: Expedited shipping incentive added to payout.")

    # Calculate estimated eco impact
    avoided_empty_km = round(haversine_distance(p_lat, p_lng, d_lat, d_lng), 1)
    fuel_saved_l = round(avoided_empty_km * 0.35, 1)
    co2_saved_kg = round(fuel_saved_l * 2.68, 1)

    return {
        "match_score": final_score,
        "route_score": round(route_score * 100, 1),
        "capacity_score": round(capacity_score * 100, 1),
        "distance_score": round(distance_score * 100, 1),
        "priority_score": round(priority_score * 100, 1),
        "timing_score": round(timing_score * 100, 1),
        "recommendation_reasons": reasons,
        "avoided_empty_km": avoided_empty_km,
        "fuel_saved_l": fuel_saved_l,
        "co2_saved_kg": co2_saved_kg
    }
