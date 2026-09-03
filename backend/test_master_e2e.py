import urllib.request
import json
import uuid
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')
BASE_URL = "http://localhost:8000/api"

results = {
    "PASSED": [],
    "FAILED": [],
    "FIXED": [],
    "REMAINING": []
}

def log_test(category, name, passed, details=""):
    status_str = "PASS" if passed else "FAIL"
    if passed:
        results["PASSED"].append(f"[{category}] {name}")
        print(f"✅ [{category}] {name} - {status_str} ({details})")
    else:
        results["FAILED"].append(f"[{category}] {name} - {details}")
        print(f"❌ [{category}] {name} - {status_str} ({details})")

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

def run_master_e2e_tests():
    print("==========================================================")
    print("   ROUTENOVA MASTER END-TO-END QA AUTOMATED TEST SUITE    ")
    print("==========================================================\n")
    
    unique_suffix = uuid.uuid4().hex[:6]
    
    # ----------------------------------------------------
    # 1. AUTHENTICATION & RBAC TESTS
    # ----------------------------------------------------
    print("--- 1. AUTHENTICATION & RBAC MODULE ---")
    
    driver_email = f"qa_driver_{unique_suffix}@routenova.in"
    shipper_email = f"qa_shipper_{unique_suffix}@routenova.in"
    password = "password123"

    # Register Driver
    status, d_reg = make_request(f"{BASE_URL}/auth/register", "POST", {
        "name": "QA Driver Ramesh", "email": driver_email, "phone": "+91 9876543210",
        "password": password, "role": "driver", "vehicle_type": "Light Commercial Truck", "vehicle_capacity_kg": 500.0
    })
    log_test("AUTH", "Register Driver", status == 200 and "access_token" in d_reg, f"Token generated for {driver_email}")
    driver_token = d_reg.get("access_token")

    # Login Driver
    status, d_login = make_request(f"{BASE_URL}/auth/login", "POST", {"email": driver_email, "password": password})
    log_test("AUTH", "Login Driver", status == 200 and d_login.get("role") == "driver", "Login payload valid")

    # Register Shipper
    status, s_reg = make_request(f"{BASE_URL}/auth/register", "POST", {
        "name": "QA Shipper Union", "email": shipper_email, "phone": "+91 9123456789",
        "password": password, "role": "shipper"
    })
    log_test("AUTH", "Register Shipper", status == 200 and "access_token" in s_reg, f"Token generated for {shipper_email}")
    shipper_token = s_reg.get("access_token")

    # Login Shipper
    status, s_login = make_request(f"{BASE_URL}/auth/login", "POST", {"email": shipper_email, "password": password})
    log_test("AUTH", "Login Shipper", status == 200 and s_login.get("role") == "shipper", "Login payload valid")

    # Invalid Credentials Test
    status, err_login = make_request(f"{BASE_URL}/auth/login", "POST", {"email": driver_email, "password": "wrong_password"})
    log_test("AUTH", "Invalid Credentials Rejection", status == 401, f"HTTP {status} returned correctly")

    # Protected Route RBAC Test (Shipper accessing Driver-only route)
    status, rbac_err = make_request(f"{BASE_URL}/matches", "GET", token=shipper_token)
    log_test("AUTH", "Protected Route RBAC Restriction", status == 403, f"HTTP {status} Forbidden returned correctly for role mismatch")

    # Logout Test
    status, logout_res = make_request(f"{BASE_URL}/auth/logout", "POST", token=driver_token)
    log_test("AUTH", "Logout Session Invalidation", status == 200, "Logout request succeeded")

    # ----------------------------------------------------
    # 2. SHIPPER MODULE & CRUD PERSISTENCE TESTS
    # ----------------------------------------------------
    print("\n--- 2. SHIPPER & SHIPMENT CRUD MODULE ---")

    # Create Shipment
    shipment_payload = {
        "name": "QA Organic Basmati Rice",
        "package_type": "Gunnysacks",
        "weight": 150.0,
        "offered_price": 2200.0,
        "pickup_location": "Bengaluru KSRTC Hub",
        "destination": "Mandya APMC Yard",
        "pickup_coordinates": {"lat": 12.9716, "lng": 77.5946},
        "destination_coordinates": {"lat": 12.5218, "lng": 76.8951},
        "priority": "HIGH"
    }
    status, create_res = make_request(f"{BASE_URL}/shipments", "POST", shipment_payload, token=shipper_token)
    shipment_id = create_res.get("id")
    log_test("SHIPPER", "Create Shipment (POST /api/shipments)", status == 200 and shipment_id is not None, f"Shipment ID: {shipment_id}")

    # View Single Shipment
    status, view_res = make_request(f"{BASE_URL}/shipments/{shipment_id}", "GET", token=shipper_token)
    log_test("SHIPPER", "View Shipment (GET /api/shipments/{id})", status == 200 and view_res.get("name") == "QA Organic Basmati Rice", "Name & fields verified")

    # Edit Shipment
    status, edit_res = make_request(f"{BASE_URL}/shipments/{shipment_id}", "PUT", {"offered_price": 2500.0, "priority": "URGENT"}, token=shipper_token)
    log_test("SHIPPER", "Edit Shipment (PUT /api/shipments/{id})", status == 200 and edit_res.get("offered_price") == 2500.0, "Price updated to ₹2,500")

    # ----------------------------------------------------
    # 3. DRIVER & SMART MATCHING ENGINE TESTS
    # ----------------------------------------------------
    print("\n--- 3. DRIVER & SMART MATCHING ENGINE MODULE ---")

    # Re-login driver for token
    _, d_login = make_request(f"{BASE_URL}/auth/login", "POST", {"email": driver_email, "password": password})
    driver_token = d_login["access_token"]

    # View Available Shipments
    status, avail_res = make_request(f"{BASE_URL}/shipments?status=AVAILABLE", "GET", token=driver_token)
    log_test("DRIVER", "View Available Shipments (GET /api/shipments?status=AVAILABLE)", status == 200 and any(s["id"] == shipment_id for s in avail_res), f"Found {len(avail_res)} available shipments")

    # Smart Matching Engine Query
    status, match_res = make_request(f"{BASE_URL}/matches?sort_by=match_score&available_capacity=400.0&truck_capacity=500.0", "GET", token=driver_token)
    top_match = match_res[0] if isinstance(match_res, list) and len(match_res) > 0 else {}
    log_test("DRIVER", "Smart Matching Score Calculation", status == 200 and top_match.get("match_score", 0) >= 50, f"Match Score: {top_match.get('match_score')}%")

    # Capacity Overload Validation Test
    status, over_match = make_request(f"{BASE_URL}/matches?available_capacity=50.0&truck_capacity=500.0", "GET", token=driver_token)
    over_score = over_match[0].get("match_score") if over_match else 100
    log_test("DRIVER", "Capacity Overload Penalty", status == 200 and over_score <= 35, f"Overload score penalized to {over_score}%")

    # Accept Shipment
    status, accept_res = make_request(f"{BASE_URL}/shipments/{shipment_id}/accept", "POST", token=driver_token)
    log_test("DRIVER", "Accept Shipment (POST /api/shipments/{id}/accept)", status == 200 and accept_res.get("status") == "ACCEPTED", "Status: ACCEPTED")

    # ----------------------------------------------------
    # 4. PROOF OF DELIVERY & ESCROW LIFECYCLE TESTS
    # ----------------------------------------------------
    print("\n--- 4. PROOF OF DELIVERY & ESCROW LIFECYCLE MODULE ---")

    # Pickup Proof
    status, pickup_res = make_request(f"{BASE_URL}/proofs/pickup", "POST", {
        "shipment_id": shipment_id, "photo_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d",
        "image_metadata": {"capture_mode": "DEMO_CAMERA_METADATA"}
    }, token=driver_token)
    log_test("PROOF", "Pickup Proof & Mark PICKED_UP", status == 200 and pickup_res.get("new_shipment_status") == "PICKED_UP", "Status: PICKED_UP")

    # Delivery Proof
    status, del_res = make_request(f"{BASE_URL}/proofs/delivery", "POST", {
        "shipment_id": shipment_id, "photo_url": "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55",
        "image_metadata": {"capture_mode": "DEMO_CAMERA_METADATA"}
    }, token=driver_token)
    verification_code = del_res.get("verification_code")
    log_test("PROOF", "Delivery Proof & Generate QR", status == 200 and del_res.get("new_shipment_status") == "ARRIVED", f"Verification Code: {verification_code}")

    # Verify QR Code & Release Payment
    status, verify_res = make_request(f"{BASE_URL}/proofs/verify", "POST", {
        "shipment_id": shipment_id, "verification_code": verification_code, "verifier_name": "Mandya APMC Inspector"
    }, token=driver_token)
    log_test("PROOF", "QR Code Verification & Payment Release", status == 200 and verify_res.get("new_shipment_status") == "PAYMENT_RELEASED", "Status: PAYMENT_RELEASED")

    # ----------------------------------------------------
    # 5. REAL-TIME TRACKING MODULE TESTS
    # ----------------------------------------------------
    print("\n--- 5. REAL-TIME TRACKING MODULE ---")

    # POST Tracking Ping
    status, ping_res = make_request(f"{BASE_URL}/tracking", "POST", {
        "shipment_id": shipment_id, "latitude": 12.8000, "longitude": 77.3000, "speed": 48.0, "is_demo": True
    }, token=driver_token)
    log_test("TRACKING", "POST /api/tracking Ping", status == 200 and ping_res.get("status") == "success", "GPS ping saved")

    # GET Tracking State
    status, track_res = make_request(f"{BASE_URL}/tracking/{shipment_id}", "GET", token=shipper_token)
    log_test("TRACKING", "GET /api/tracking/{id} State", status == 200 and track_res.get("distance_remaining_km", 0) > 0 and "eta_minutes" in track_res, f"ETA: {track_res.get('eta_minutes')} mins, Distance: {track_res.get('distance_remaining_km')} km")

    # ----------------------------------------------------
    # 6. ENVIRONMENTAL ANALYTICS MODULE TESTS
    # ----------------------------------------------------
    print("\n--- 6. ENVIRONMENTAL IMPACT ANALYTICS MODULE ---")

    status, env_res = make_request(f"{BASE_URL}/analytics/environmental", "GET", token=shipper_token)
    log_test("ANALYTICS", "Environmental Analytics Engine Math", status == 200 and env_res.get("co2_saved_kg", 0) > 0 and "assumptions" in env_res, f"CO2 Avoided: {env_res.get('co2_saved_kg')} kg")

    # ----------------------------------------------------
    # 7. ERROR CASES & EDGE CONDITIONS TESTS
    # ----------------------------------------------------
    print("\n--- 7. ERROR CASES & VALIDATION TESTS ---")

    # Invalid Weight (weight <= 0)
    status, err_weight = make_request(f"{BASE_URL}/shipments", "POST", {
        "name": "Invalid Weight Cargo", "package_type": "Crates", "weight": -10.0, "offered_price": 1000.0,
        "pickup_location": "A", "destination": "B"
    }, token=shipper_token)
    log_test("ERROR_HANDLING", "Rejection of Invalid Weight (weight <= 0)", status == 422, f"HTTP {status} Unprocessable Entity returned")

    # Invalid Offered Price (price <= 0)
    status, err_price = make_request(f"{BASE_URL}/shipments", "POST", {
        "name": "Invalid Price Cargo", "package_type": "Crates", "weight": 50.0, "offered_price": 0.0,
        "pickup_location": "A", "destination": "B"
    }, token=shipper_token)
    log_test("ERROR_HANDLING", "Rejection of Zero Offered Price", status == 422, f"HTTP {status} Unprocessable Entity returned")

    # Missing Required Name Field
    status, err_name = make_request(f"{BASE_URL}/shipments", "POST", {
        "package_type": "Crates", "weight": 50.0, "offered_price": 1000.0,
        "pickup_location": "A", "destination": "B"
    }, token=shipper_token)
    log_test("ERROR_HANDLING", "Rejection of Missing Shipment Name", status == 422, f"HTTP {status} Unprocessable Entity returned")

    # ----------------------------------------------------
    # MASTER QA SUMMARY
    # ----------------------------------------------------
    print("\n==========================================================")
    print("             FINAL ROUTENOVA E2E QA TEST REPORT            ")
    print("==========================================================")
    print(f"PASSED TESTS: {len(results['PASSED'])}")
    for p in results["PASSED"]:
        print(f"  ✓ {p}")
        
    print(f"\nFAILED TESTS: {len(results['FAILED'])}")
    for f in results["FAILED"]:
        print(f"  ❌ {f}")

    print(f"\nFIXED BUGS: {len(results['FIXED'])}")
    for fx in results["FIXED"]:
        print(f"  🛠️ {fx}")

    print(f"\nREMAINING BUGS: {len(results['REMAINING'])}")
    for r in results["REMAINING"]:
        print(f"  ⚠️ {r}")

    print("\n==========================================================")
    if len(results["FAILED"]) == 0 and len(results["REMAINING"]) == 0:
        print("🎉 ALL END-TO-END QA TEST SCENARIOS PASSED WITH 100% SUCCESS!")
    print("==========================================================")

if __name__ == "__main__":
    run_master_e2e_tests()
