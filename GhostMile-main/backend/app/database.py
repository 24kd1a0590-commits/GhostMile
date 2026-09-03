import logging
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger("routenova.db")

# In-memory storage fallback for seamless DEMO MODE when MongoDB is offline
class MemoryDB:
    def __init__(self):
        self.users: Dict[str, Dict[str, Any]] = {}
        self.shipments: Dict[str, Dict[str, Any]] = {}
        self.drivers: Dict[str, Dict[str, Any]] = {}
        self.tracking: Dict[str, List[Dict[str, Any]]] = {}
        self.payments: Dict[str, Dict[str, Any]] = {}
        self.delivery_proofs: Dict[str, Dict[str, Any]] = {}
        self.notifications: Dict[str, List[Dict[str, Any]]] = {}

memory_db = MemoryDB()

db_client = None
db_instance = None
use_mongo = False

async def init_db():
    global db_client, db_instance, use_mongo
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Ping mongo
        await client.admin.command('ping')
        db_client = client
        db_instance = client[settings.DATABASE_NAME]
        use_mongo = True
        logger.info("Connected to MongoDB successfully.")
    except Exception as e:
        use_mongo = False
        logger.warning(f"MongoDB connection unavailable ({e}). Falling back to In-Memory Demo Storage.")

def get_db():
    return db_instance if use_mongo else memory_db
