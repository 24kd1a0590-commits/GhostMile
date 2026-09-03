import math
from typing import Dict, Any, List, Optional
from datetime import datetime

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the Great Circle distance between two points in kilometers."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_detour_km(
    driver_curr: Dict[str, float],
    driver_dest: Dict[str, float],
    pickup: Dict[str, float],
    dropoff: Dict[str, float]
) -> float:
    """
    Calculate estimated extra detour kilometers:
    Detour = dist(driver_curr, pickup) + dist(pickup, dropoff) + dist(dropoff, driver_dest) - dist(driver_curr, driver_dest)
    """
    direct_route = haversine_distance(driver_curr["lat"], driver_curr["lng"], driver_dest["lat"], driver_dest["lng"])
    
    seg1 = haversine_distance(driver_curr["lat"], driver_curr["lng"], pickup["lat"], pickup["lng"])
    seg2 = haversine_distance(pickup["lat"], pickup["lng"], dropoff["lat"], dropoff["lng"])
    seg3 = haversine_distance(dropoff["lat"], dropoff["lng"], driver_dest["lat"], driver_dest["lng"])
    
    total_with_pickup = seg1 + seg2 + seg3
    detour = max(0.0, total_with_pickup - direct_route)
    return round(detour, 1)

def evaluate_match(
    driver: Dict[str, Any],
    shipment: Dict[str, Any]
) -> Dict[str, Any]:
    """
    RouteNova Smart Matching Engine: Deterministic Scoring Algorithm.
    
    Formulas:
    - route_score: Based on detour distance (100% for 0km, decreasing to 0 for 30km+ detour)
    - capacity_score: Based on payload weight vs remaining capacity
    - distance_score: Pickup proximity to driver current position
    - priority_score: URGENT=1.0, HIGH=0.85, MEDIUM=0.70, LOW=0.50
    - timing_score: Schedule window compatibility (0.90 default)
    
    Final match_score = 0.35*route_score + 0.25*capacity_score + 0.20*distance_score + 0.10*priority_score + 0.10*timing_score
    """
    driver_curr = driver.get("current_location") or {"lat": 12.9716, "lng": 77.5946}
    driver_dest = driver.get("destination") or {"lat": 12.5218, "lng": 76.8951}
    truck_capacity = float(driver.get("truck_capacity") or driver.get("max_capacity_kg") or 500.0)
    available_capacity = float(driver.get("available_capacity") or driver.get("available_capacity_kg") or 400.0)

    # Extract shipment fields
    p_loc = shipment.get("pickup_coordinates") or shipment.get("pickup_location")
    if isinstance(p_loc, str) or not isinstance(p_loc, dict):
        p_loc = {"lat": 12.9716, "lng": 77.5946}
        
    d_loc = shipment.get("destination_coordinates") or shipment.get("destination")
    if isinstance(d_loc, str) or not isinstance(d_loc, dict):
        d_loc = {"lat": 12.5218, "lng": 76.8951}

    weight = float(shipment.get("weight") or shipment.get("weight_kg") or 50.0)
    offered_price = float(shipment.get("offered_price") or shipment.get("offered_price_inr") or 1500.0)
    priority = (shipment.get("priority") or "MEDIUM").upper()

    # 1. Detour & Route Score (35%)
    detour_km = calculate_detour_km(driver_curr, driver_dest, p_loc, d_loc)
    route_score = max(0.0, 1.0 - (detour_km / 30.0))

    # 2. Capacity Score (25%)
    if weight > available_capacity:
        capacity_score = 0.0
    else:
        cap_used_ratio = weight / truck_capacity
        capacity_score = min(1.0, 0.75 + (cap_used_ratio * 0.25))

    cap_used_pct = round((weight / truck_capacity) * 100.0, 1)

    # 3. Pickup Proximity / Distance Score (20%)
    pickup_dist_km = haversine_distance(driver_curr["lat"], driver_curr["lng"], p_loc["lat"], p_loc["lng"])
    distance_score = max(0.0, 1.0 - (pickup_dist_km / 40.0))

    # 4. Priority Score (10%)
    priority_map = {"URGENT": 1.0, "HIGH": 0.85, "MEDIUM": 0.70, "LOW": 0.50}
    priority_score = priority_map.get(priority, 0.70)

    # 5. Timing Score (10%)
    timing_score = 0.90

    # Final Match Score Calculation (0 to 100%)
    raw_match = (
        0.35 * route_score +
        0.25 * capacity_score +
        0.20 * distance_score +
        0.10 * priority_score +
        0.10 * timing_score
    )

    # If capacity is exceeded, penalize severely
    if weight > available_capacity:
        raw_match = min(raw_match, 0.35)

    match_score = round(raw_match * 100.0)

    # Generate Human Recommendation & Reason Labels
    if match_score >= 85:
        recommendation = "Excellent Route Fit"
    elif match_score >= 70:
        recommendation = "Good Match"
    elif match_score >= 55:
        recommendation = "Moderate Match"
    else:
        recommendation = "Low Corridor Fit"

    reason = f"Shipment is near your route corridor ({detour_km} km detour) and uses {round(cap_used_pct)}% of truck capacity."

    # Environmental Impact Math
    # Avoided empty return trip distance
    avoided_km = round(haversine_distance(p_loc["lat"], p_loc["lng"], d_loc["lat"], d_loc["lng"]), 1)
    fuel_saved_liters = round(avoided_km * 0.35, 2)  # 0.35 L diesel per km
    co2_saved_kg = round(fuel_saved_liters * 2.68, 2)  # 2.68 kg CO2 per L

    return {
        "match_score": match_score,
        "recommendation": recommendation,
        "reason": reason,
        "estimated_detour_km": detour_km,
        "estimated_earnings": offered_price,
        "fuel_saved_liters": fuel_saved_liters,
        "co2_saved_kg": co2_saved_kg,
        "capacity_used_pct": cap_used_pct,
        "weight_kg": weight,
        "route_score": round(route_score * 100, 1),
        "capacity_score": round(capacity_score * 100, 1),
        "distance_score": round(distance_score * 100, 1),
        "priority_score": round(priority_score * 100, 1),
        "timing_score": round(timing_score * 100, 1)
    }
