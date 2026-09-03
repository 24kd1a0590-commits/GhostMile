import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "RouteNova API"
    DEMO_MODE: bool = True
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "routenova")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "routenova-super-secret-key-sih2024-hackathon")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Impact math configuration assumptions
    FUEL_CONSUMPTION_RATE: float = 0.35  # Liters of diesel per km for average light truck
    CO2_EMISSION_FACTOR: float = 2.68    # kg of CO2 per Liter of diesel

    class Config:
        env_file = ".env"

settings = Settings()
