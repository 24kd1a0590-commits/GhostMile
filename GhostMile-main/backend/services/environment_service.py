# RouteNova Environmental Impact Engine Wrapper
from app.services.environment_service import (
    calculate_environmental_impact,
    DEFAULT_FUEL_EFFICIENCY_KM_L,
    DEFAULT_EMISSION_FACTOR_KG_L
)

__all__ = [
    "calculate_environmental_impact",
    "DEFAULT_FUEL_EFFICIENCY_KM_L",
    "DEFAULT_EMISSION_FACTOR_KG_L"
]
