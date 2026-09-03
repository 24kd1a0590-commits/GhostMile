from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import logging

from app.config import settings
from app.database import init_db, memory_db, use_mongo, get_db
from app.auth import hash_password
from app.routes import (
    auth_routes,
    shipment_routes,
    matching_routes,
    tracking_routes,
    proof_routes,
    payment_routes,
    analytics_routes
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("routenova.main")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="RouteNova Smart Rural Micro-Logistics Platform Backend"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(shipment_routes.router)
app.include_router(matching_routes.router)
app.include_router(tracking_routes.router)
app.include_router(proof_routes.router)
app.include_router(payment_routes.router)
app.include_router(analytics_routes.router)

def seed_demo_data():
    """Seed initial realistic Indian rural logistics loads & users."""
    now = datetime.utcnow().isoformat()
    pwd = hash_password("demo123")

    demo_users = [
        {
            "_id": "usr_driver_1",
            "id": "usr_driver_1",
            "name": "Ramesh Kumar (Driver)",
            "email": "driver@routenova.in",
            "phone": "+91 9876543210",
            "password": pwd,
            "role": "driver",
            "vehicle_type": "Ashok Leyland Dost (Light Truck)",
            "vehicle_capacity_kg": 500.0,
            "created_at": now
        },
        {
            "_id": "usr_shipper_1",
            "id": "usr_shipper_1",
            "name": "Green Valley Agri Cooperative",
            "email": "shipper@routenova.in",
            "phone": "+91 9123456789",
            "password": pwd,
            "role": "shipper",
            "created_at": now
        },
        {
            "_id": "usr_admin_1",
            "id": "usr_admin_1",
            "name": "RouteNova Admin",
            "email": "admin@routenova.in",
            "phone": "+91 9000000000",
            "password": pwd,
            "role": "admin",
            "created_at": now
        }
    ]

    demo_shipments = [
        {
            "_id": "shp_101",
            "id": "shp_101",
            "shipper_id": "usr_shipper_1",
            "shipper_name": "Green Valley Agri Cooperative",
            "title": "Organic Basmati Rice Sacks",
            "package_type": "Gunnysacks (4x)",
            "weight_kg": 120.0,
            "pickup_location": {"lat": 12.9716, "lng": 77.5946, "address_name": "KSRTC Depot, Bengaluru"},
            "destination_location": {"lat": 12.5218, "lng": 76.8951, "address_name": "Mandya APMC Market"},
            "offered_price_inr": 1850.0,
            "priority": "HIGH",
            "status": "AVAILABLE",
            "driver_id": None,
            "driver_name": None,
            "created_at": now,
            "updated_at": now
        },
        {
            "_id": "shp_102",
            "id": "shp_102",
            "shipper_id": "usr_shipper_1",
            "shipper_name": "Mandya Organic Seed Producers",
            "title": "Certified Tomato & Chili Seed Crates",
            "package_type": "Wooden Crates (2x)",
            "weight_kg": 45.0,
            "pickup_location": {"lat": 12.8500, "lng": 77.6500, "address_name": "Electronics City Phase 2"},
            "destination_location": {"lat": 12.3051, "lng": 76.6551, "address_name": "Mysuru Wholesale Hub"},
            "offered_price_inr": 1500.0,
            "priority": "URGENT",
            "status": "AVAILABLE",
            "driver_id": None,
            "driver_name": None,
            "created_at": now,
            "updated_at": now
        },
        {
            "_id": "shp_103",
            "id": "shp_103",
            "shipper_id": "usr_shipper_1",
            "shipper_name": "Kaveri Dairy Farmers Guild",
            "title": "Bio-Fertilizer & Compost Bags",
            "package_type": "Heavy Duty Bags (10x)",
            "weight_kg": 250.0,
            "pickup_location": {"lat": 12.9250, "lng": 77.5850, "address_name": "Jayanagar 4th Block"},
            "destination_location": {"lat": 12.5218, "lng": 76.8951, "address_name": "Mandya Rural Cold Storage"},
            "offered_price_inr": 2900.0,
            "priority": "MEDIUM",
            "status": "AVAILABLE",
            "driver_id": None,
            "driver_name": None,
            "created_at": now,
            "updated_at": now
        }
    ]

    for u in demo_users:
        memory_db.users[u["id"]] = u
    for s in demo_shipments:
        memory_db.shipments[s["id"]] = s

    logger.info("Seeded initial demo users and shipments in memory.")

@app.on_event("startup")
async def startup_event():
    await init_db()
    seed_demo_data()

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "demo_mode": settings.DEMO_MODE,
        "database": "MongoDB" if use_mongo else "In-Memory Demo Engine"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
