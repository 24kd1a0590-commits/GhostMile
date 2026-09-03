import urllib.request
import json
import uuid
import sys

sys.stdout.reconfigure(encoding='utf-8')
BASE_URL = "http://localhost:8000/api"

def make_request(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"raw": err_body}

def run_tracking_tests():
    print("=== ROUTENOVA REAL-TIME TRACKING TEST SUITE ===")
    unique_suffix = uuid.uuid4().hex[:6]
    
    # 1. Register Driver & Shipper
    d_email = f"track_driver_{unique_suffix}@routenova.in"
    s_email = f"track_shipper_{unique_suffix}@routenova.in"

    _, d_reg = make_request(f"{BASE_URL}/auth/register", "POST", {
        "name": "Tracking Driver Ramesh", "email": d_email, "phone": "+91 9876543210",
        "password": "password123", "role": "driver"
    })
    driver_token = d_reg["access_token"]

    _, s_reg = make_request(f"{BASE_URL}/auth/register", "POST", {
        "name": "Tracking Shipper Cooperative", "email": s_email, "phone": "+91 9123456789",
        "password": "password123", "role": "shipper"
    })
    shipper_token = s_reg["access_token"]
    print("[OK] Auth Setup Completed")

    # 2. Create Shipment
    _, shp = make_request(f"{BASE_URL}/shipments", "POST", {
        "name": "Tracked Agri Goods", "package_type": "Crates", "weight": 100.0, "offered_price": 1800.0,
        "pickup_location": "Bengaluru Hub", "destination": "Mandya Hub",
        "pickup_coordinates": {"lat": 12.9716, "lng": 77.5946},
        "destination_coordinates": {"lat": 12.5218, "lng": 76.8951},
        "priority": "HIGH"
    }, token=shipper_token)
    shipment_id = shp["id"]
    print(f"[OK] Shipment Created (ID: {shipment_id})")

    # 3. Post Driver GPS Ping (POST /api/tracking)
    ping_payload = {
        "shipment_id": shipment_id,
        "latitude": 12.8000,
        "longitude": 77.3000,
        "speed": 45.5,
        "is_demo": True
    }
    status, ping_res = make_request(f"{BASE_URL}/tracking", "POST", ping_payload, token=driver_token)
    assert status == 200, f"Post tracking ping failed: {ping_res}"
    print(f"[OK] STEP 1: POST /api/tracking Ping - SUCCESS (Status: {ping_res['status']})")

    # 4. Fetch Tracking State as Shipper (GET /api/tracking/{shipment_id})
    status, track_res = make_request(f"{BASE_URL}/tracking/{shipment_id}", "GET", token=shipper_token)
    assert status == 200, f"GET /api/tracking/{shipment_id} failed: {track_res}"
    
    assert track_res["shipment_id"] == shipment_id
    assert track_res["current_location"]["lat"] == 12.8000
    assert track_res["current_location"]["lng"] == 77.3000
    assert track_res["speed_kmh"] == 45.5
    assert track_res["distance_remaining_km"] > 0
    assert track_res["eta_minutes"] > 0
    assert track_res["is_demo"] == True
    assert len(track_res["path_history"]) >= 1

    print("\n--- Live Tracking State Summary ---")
    print(f"Driver Location: lat={track_res['current_location']['lat']}, lng={track_res['current_location']['lng']}")
    print(f"Speed: {track_res['speed_kmh']} km/h")
    print(f"Distance Remaining: {track_res['distance_remaining_km']} km")
    print(f"ETA: {track_res['eta_minutes']} mins")
    print(f"Mode: {'DEMO TRACKING' if track_res['is_demo'] else 'LIVE GPS TRACKING'}")

    print("\n🎉 REAL-TIME TRACKING TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_tracking_tests()
