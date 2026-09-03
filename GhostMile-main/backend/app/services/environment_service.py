from typing import Dict, Any, List

# Standard IPCC & GHG Protocol Constants for Rural Micro-Logistics
DEFAULT_FUEL_EFFICIENCY_KM_L = 8.5  # 8.5 km per Liter for Light Commercial Vehicles (LCVs / Pickups)
DEFAULT_EMISSION_FACTOR_KG_L = 2.68  # 2.68 kg CO2 per Liter of Diesel combustion

def calculate_environmental_impact(
    avoided_distance_km: float,
    empty_trips_count: int = 0,
    loads_consolidated_count: int = 0,
    fuel_efficiency: float = DEFAULT_FUEL_EFFICIENCY_KM_L,
    emission_factor: float = DEFAULT_EMISSION_FACTOR_KG_L
) -> Dict[str, Any]:
    """
    RouteNova Environmental Impact Engine.
    
    Formulas:
    - fuel_saved = avoided_distance_km / vehicle_fuel_efficiency
    - co2_saved = fuel_saved * emission_factor
    """
    eff = max(0.1, fuel_efficiency)
    fuel_saved = round(avoided_distance_km / eff, 2)
    co2_saved = round(fuel_saved * emission_factor, 2)

    return {
        "avoided_empty_distance_km": round(avoided_distance_km, 1),
        "fuel_saved_liters": fuel_saved,
        "co2_saved_kg": co2_saved,
        "co2_saved_tonnes": round(co2_saved / 1000.0, 3),
        "empty_trips_reduced": empty_trips_count,
        "loads_consolidated": loads_consolidated_count,
        "assumptions": {
            "vehicle_fuel_efficiency_km_per_liter": eff,
            "emission_factor_kg_per_liter": emission_factor,
            "vehicle_type": "Light Commercial Diesel Truck / LCV",
            "explanation": f"Based on IPCC / GHG Protocol standards: Rural diesel LCV trucks average {eff} km/L. 1 Liter of diesel combustion produces {emission_factor} kg of CO2."
        }
    }
