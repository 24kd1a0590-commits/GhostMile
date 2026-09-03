# RouteNova | Smart Rural Micro-Logistics Platform 🚚📦

> **Smart India Hackathon 2024 MVP**  
> *Connecting commercial drivers with unused return capacity to rural farmers, suppliers, and micro-shippers needing small-batch freight transportation.*

---

## 📌 Project Overview

**RouteNova** solves a critical inefficiency in Indian rural supply chains: **empty return trips**. Commercial light trucks frequently travel back empty from market towns to rural hubs. Simultaneously, rural farmers and small businesses struggle to find affordable, small-payload freight options.

RouteNova algorithmically matches available return truck payload space with nearby rural shipments, eliminating empty kilometers, boosting driver earnings, lowering transport costs for farmers, and dramatically reducing diesel carbon emissions.

---

## 🏗️ Architecture & Technology Stack

```
                                  +-----------------------+
                                  |   React + Vite SPA    |
                                  |  Tailwind CSS UI      |
                                  |  React-Leaflet Maps   |
                                  +-----------+-----------+
                                              |
                                              | HTTP / REST (JWT Auth)
                                              v
                                  +-----------------------+
                                  |   FastAPI Backend     |
                                  | (Python 3.10+ / Async)|
                                  +-----+-----------+-----+
                                        |           |
                        +---------------+           +---------------+
                        |                                           |
                        v                                           v
             +--------------------+                      +--------------------+
             |   MongoDB Database |                      | Smart Match Engine |
             | (Users, Shipments, |                      |  (Route Corridor,  |
             |  Tracking, Proofs) |                      | Capacity, Priority)|
             +--------------------+                      +--------------------+
```

### Stack Components
* **Frontend**: React (Vite), Tailwind CSS (v4), Lucide Icons (`lucide-react`), Leaflet / React-Leaflet, Recharts, Canvas-Confetti, QRCode.react.
* **Backend**: Python FastAPI (Async framework), Pydantic v2, PyJWT, Passlib (bcrypt), Motor / PyMongo driver.
* **Database**: MongoDB with automatic **In-Memory Demo Engine Fallback** if a local MongoDB server is disconnected.
* **Stand-Alone Demo Mode**: Environment variable `DEMO_MODE=true` allowing 100% offline hackathon pitch presentations.

---

## 🚀 Key Features & Core Modules

1. **Modern Landing Page**: Problem vs solution comparison, interactive CO2/fuel savings calculator, step-by-step workflow.
2. **JWT Authentication & RBAC**: Roles for `driver`, `shipper`, and `admin` with 1-click instant demo login buttons.
3. **Driver Dashboard**: Route corridor manager, real-time payload capacity meter (500kg truck limit), recommended loads list, bundle multi-selection.
4. **Smart Matching Engine**: Algorithm scoring loads ($0.35 \cdot \text{route} + 0.25 \cdot \text{capacity} + 0.20 \cdot \text{distance} + 0.10 \cdot \text{priority} + 0.10 \cdot \text{timing}$) with explicit recommendation explanations.
5. **Shipper Dashboard**: Dispatch load wizard (weight, offered price, priority), active dispatches tracker, live driver location viewer.
6. **Complete Shipment Lifecycle**: `AVAILABLE` $\rightarrow$ `MATCHED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `ARRIVED` $\rightarrow$ `DELIVERED` $\rightarrow$ `PAYMENT_RELEASED`.
7. **Live GPS Corridor Tracking**: Leaflet interactive map with custom truck marker, destination pin, polyline route, ETA calculation, and demo motion playback.
8. **Digital Proof of Delivery**: Pickup photo capture, delivery unpacking photo capture, auto-generated QR code verification.
9. **Demo Escrow & Instant Payout**: Simulated escrow system locking funds upon pickup and instantly settling UPI payments upon QR verification.
10. **Environmental Impact Engine**: Dynamic fuel saved & CO2 avoided calculation ($2.68 \text{ kg CO2 / L diesel}$).
11. **Analytics Dashboard**: Interactive Recharts graphs for monthly earnings, deliveries, and sustainability metrics.
12. **Admin Control Center**: User counts, active dispatches, system health status indicator, log audit feed.

---

## 🔑 Demo Credentials

To present or test the application instantly:

| Role | Demo Email | Demo Password | Quick Action |
| :--- | :--- | :--- | :--- |
| **Driver** | `driver@routenova.in` | `demo123` | Click **"⚡ Driver"** on Auth Modal |
| **Shipper** | `shipper@routenova.in` | `demo123` | Click **"⚡ Shipper"** on Auth Modal |
| **Admin** | `admin@routenova.in` | `demo123` | Click **"⚡ Admin"** on Auth Modal |

---

## 🛠️ Installation & Setup

### Prerequisites
* **Node.js** (v18+) & **npm**
* **Python** (3.10+)

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows PowerShell
.\venv\Scripts\Activate.ps1

# Install Dependencies
pip install fastapi uvicorn pymongo motor pydantic pydantic-settings pyjwt passlib python-multipart python-dotenv

# Run Server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Backend API will run at `http://localhost:8000` (Swagger docs available at `http://localhost:8000/docs`).

### 2. Frontend Setup
```bash
cd frontend
npm install

# Run Development Server
npm run dev -- --port 5173
```
Frontend Web Application will run at `http://localhost:5173`.

---

## 📡 API Endpoint Summary

* **Authentication**:
  * `POST /api/auth/register` - Create user account
  * `POST /api/auth/login` - Authenticate & receive JWT token
  * `GET /api/users/me` - Fetch user profile
* **Shipments**:
  * `POST /api/shipments` - Create new shipment
  * `GET /api/shipments` - List active shipments
  * `POST /api/shipments/{id}/accept` - Driver accepts load
* **Smart Match Engine**:
  * `POST /api/matches` - Get ranked shipments matching driver route & capacity
* **Tracking & Proofs**:
  * `POST /api/tracking` - Log driver GPS ping
  * `GET /api/tracking/{shipment_id}` - Get live location, distance remaining & ETA
  * `POST /api/proofs` - Upload pickup/delivery photo metadata & trigger status advancement
* **Escrow & Analytics**:
  * `POST /api/payments/escrow` - Lock demo escrow funds
  * `POST /api/payments/release` - Release payment upon QR code scan
  * `GET /api/analytics` - System metrics & CO2/fuel savings

---

## 🔮 Future Improvements

1. WhatsApp / Telegram bot integration for offline SMS load dispatch by rural farmers without smartphones.
2. Integration with OSRM (Open Source Routing Machine) self-hosted backend for turn-by-turn navigation offline.
3. Automated multi-stop vehicle routing problem (VRP) solver for combining 5+ micro-loads along return corridors.
