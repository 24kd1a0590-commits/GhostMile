from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
from typing import Optional, List, Dict, Any
from enum import Enum
import re
from datetime import datetime

class UserRole(str, Enum):
    DRIVER = "driver"
    SHIPPER = "shipper"
    ADMIN = "admin"

class ShipmentStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    MATCHED = "MATCHED"
    ACCEPTED = "ACCEPTED"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    ARRIVED = "ARRIVED"
    DELIVERED = "DELIVERED"
    PAYMENT_RELEASED = "PAYMENT_RELEASED"
    CANCELLED = "CANCELLED"

class ShipmentPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class ProofType(str, Enum):
    PICKUP = "PICKUP"
    DELIVERY = "DELIVERY"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    ESCROW_HELD = "ESCROW_HELD"
    RELEASED = "RELEASED"
    FAILED = "FAILED"

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, description="Full name required")
    email: EmailStr = Field(..., description="Valid email address required")
    phone: str = Field(..., description="Valid phone number required")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    role: UserRole = Field(..., description="User role must be driver, shipper, or admin")
    vehicle_type: Optional[str] = "Light Commercial Truck"
    vehicle_capacity_kg: Optional[float] = 500.0

    @field_validator('name')
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Name cannot be empty or whitespace')
        return v.strip()

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = v.strip()
        phone_regex = r'^\+?[0-9\s\-]{8,16}$'
        if not re.match(phone_regex, clean):
            raise ValueError('Phone number must contain between 8 and 16 digits')
        return clean

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Valid email address required")
    password: str = Field(..., min_length=1, description="Password required")

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: UserRole
    name: str
    email: str

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: UserRole
    vehicle_type: Optional[str] = None
    vehicle_capacity_kg: Optional[float] = 500.0
    created_at: str

class Location(BaseModel):
    lat: float
    lng: float
    address_name: Optional[str] = ""

class ShipmentCreate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = ""
    package_type: str = Field(..., min_length=1)
    weight: Optional[float] = None
    weight_kg: Optional[float] = None
    pickup_location: Optional[str] = "Pickup Hub"
    destination: Optional[str] = "Destination Hub"
    pickup_coordinates: Optional[Location] = None
    destination_coordinates: Optional[Location] = None
    offered_price: Optional[float] = None
    offered_price_inr: Optional[float] = None
    priority: ShipmentPriority = ShipmentPriority.MEDIUM

    @model_validator(mode='after')
    def sync_fields(self):
        if not self.name and self.title:
            self.name = self.title
        elif not self.title and self.name:
            self.title = self.name
        elif not self.name and not self.title:
            raise ValueError("Shipment name or title is required")

        w = self.weight if self.weight is not None else self.weight_kg
        if w is None or w <= 0:
            raise ValueError("Shipment weight must be greater than 0")
        self.weight = w
        self.weight_kg = w

        p = self.offered_price if self.offered_price is not None else self.offered_price_inr
        if p is None or p <= 0:
            raise ValueError("Offered price must be greater than 0")
        self.offered_price = p
        self.offered_price_inr = p

        if not self.pickup_coordinates:
            self.pickup_coordinates = Location(lat=12.9716, lng=77.5946, address_name=self.pickup_location)
        if not self.destination_coordinates:
            self.destination_coordinates = Location(lat=12.5218, lng=76.8951, address_name=self.destination)

        return self

class ShipmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    package_type: Optional[str] = None
    weight: Optional[float] = None
    offered_price: Optional[float] = None
    priority: Optional[ShipmentPriority] = None
    status: Optional[ShipmentStatus] = None
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None

class ShipmentResponse(BaseModel):
    id: str
    shipper_id: str
    shipper_name: str
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    name: str
    title: str
    description: Optional[str] = ""
    package_type: str
    weight: float
    weight_kg: float
    pickup_location: str
    destination: str
    pickup_coordinates: Location
    destination_coordinates: Location
    offered_price: float
    offered_price_inr: float
    priority: ShipmentPriority
    status: ShipmentStatus
    match_score: Optional[float] = None
    match_reasons: Optional[List[str]] = []
    created_at: str
    updated_at: str

class DriverRouteUpdate(BaseModel):
    origin: Location
    destination: Location
    available_capacity_kg: float
    max_capacity_kg: float = 500.0

class MatchResult(BaseModel):
    shipment: ShipmentResponse
    match_score: float
    route_score: float
    capacity_score: float
    distance_score: float
    priority_score: float
    timing_score: float
    recommendation_reasons: List[str]

class TrackingPing(BaseModel):
    shipment_id: str
    driver_id: Optional[str] = None
    lat: Optional[float] = None
    latitude: Optional[float] = None
    lng: Optional[float] = None
    longitude: Optional[float] = None
    speed: Optional[float] = None
    speed_kmh: Optional[float] = None
    is_demo: Optional[bool] = False
    timestamp: Optional[str] = None

    @model_validator(mode='after')
    def sync_coords(self):
        lat_val = self.lat if self.lat is not None else self.latitude
        lng_val = self.lng if self.lng is not None else self.longitude
        spd_val = self.speed_kmh if self.speed_kmh is not None else self.speed

        if lat_val is None or lng_val is None:
            raise ValueError("Latitude and longitude coordinates are required")

        self.lat = lat_val
        self.latitude = lat_val
        self.lng = lng_val
        self.longitude = lng_val
        self.speed = spd_val or 40.0
        self.speed_kmh = spd_val or 40.0
        return self

class TrackingState(BaseModel):
    shipment_id: str
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    current_location: Location
    destination_location: Location
    distance_remaining_km: float
    eta_minutes: int
    speed_kmh: float
    path_history: List[Location]
    is_demo: bool = True
    last_updated: str

class ProofModel(BaseModel):
    shipment_id: str
    driver_id: Optional[str] = None
    type: ProofType
    image_metadata: Dict[str, Any] = Field(default_factory=dict)
    photo_url: Optional[str] = None
    timestamp: Optional[str] = None
    verification_status: str = "VERIFIED"

class ProofUpload(BaseModel):
    shipment_id: str
    stage: Optional[str] = "delivery"
    photo_url: Optional[str] = None
    image_metadata: Optional[Dict[str, Any]] = None
    verifier_name: Optional[str] = None
    verification_code: Optional[str] = None

class ProofVerifyRequest(BaseModel):
    shipment_id: str
    verification_code: str = Field(..., min_length=4)
    verifier_name: Optional[str] = "Receiver / APMC Inspector"

class PaymentEscrowRequest(BaseModel):
    shipment_id: str
    amount_inr: float = Field(..., gt=0)

class PaymentReleaseRequest(BaseModel):
    shipment_id: str

class PaymentRecord(BaseModel):
    transaction_id: str
    shipment_id: str
    shipper_id: Optional[str] = None
    driver_id: Optional[str] = None
    amount_inr: float
    status: PaymentStatus
    created_at: str
    released_at: Optional[str] = None
    disclaimer: str = "DEMO PAYMENT — No real money transferred"

class AnalyticsOverview(BaseModel):
    total_users: int
    total_drivers: int
    total_shippers: int
    active_shipments: int
    completed_deliveries: int
    total_revenue_inr: float
    empty_km_avoided: float
    fuel_saved_liters: float
    co2_avoided_kg: float
