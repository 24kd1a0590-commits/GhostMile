import urllib.request
import json
import uuid
import sys

# Set standard output encoding to UTF-8
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

def run_tests():
    print("=== ROUTENOVA AUTHENTICATION & RBAC SUITE ===")
    unique_suffix = uuid.uuid4().hex[:6]
    
    # 1. Register Driver
    driver_email = f"test_driver_{unique_suffix}@routenova.in"
    driver_payload = {
        "name": "Test Driver Ramesh",
        "email": driver_email,
        "phone": "+91 9876543210",
        "password": "driverPassword123",
        "role": "driver",
        "vehicle_type": "Ashok Leyland Dost",
        "vehicle_capacity_kg": 500.0
    }
    status_code, driver_reg_res = make_request(f"{BASE_URL}/auth/register", "POST", driver_payload)
    assert status_code == 200, f"Driver registration failed: {driver_reg_res}"
    driver_token = driver_reg_res["access_token"]
    print(f"[OK] STEP 1: Register Driver - SUCCESS (JWT Issued: {driver_token[:20]}...)")

    # 2. Login Driver
    driver_login_payload = {"email": driver_email, "password": "driverPassword123"}
    status_code, driver_login_res = make_request(f"{BASE_URL}/auth/login", "POST", driver_login_payload)
    assert status_code == 200, f"Driver login failed: {driver_login_res}"
    assert driver_login_res["role"] == "driver"
    print("[OK] STEP 2: Login Driver - SUCCESS (Role: driver)")

    # 3. Access Driver Dashboard / Protected Matches Route
    route_payload = {
        "origin": {"lat": 12.9716, "lng": 77.5946},
        "destination": {"lat": 12.5218, "lng": 76.8951},
        "available_capacity_kg": 400.0,
        "max_capacity_kg": 500.0
    }
    status_code, matches_res = make_request(f"{BASE_URL}/matches", "POST", route_payload, token=driver_token)
    assert status_code == 200, f"Driver route matches access failed: {matches_res}"
    print(f"[OK] STEP 3: Access Driver Dashboard - SUCCESS (Returned {len(matches_res)} matched loads)")

    # 4. Register Shipper
    shipper_email = f"test_shipper_{unique_suffix}@routenova.in"
    shipper_payload = {
        "name": "Mandya Agri Co-op",
        "email": shipper_email,
        "phone": "+91 9123456789",
        "password": "shipperPassword123",
        "role": "shipper"
    }
    status_code, shipper_reg_res = make_request(f"{BASE_URL}/auth/register", "POST", shipper_payload)
    assert status_code == 200, f"Shipper registration failed: {shipper_reg_res}"
    shipper_token = shipper_reg_res["access_token"]
    print(f"[OK] STEP 4: Register Shipper - SUCCESS (JWT Issued: {shipper_token[:20]}...)")

    # 5. Login Shipper
    shipper_login_payload = {"email": shipper_email, "password": "shipperPassword123"}
    status_code, shipper_login_res = make_request(f"{BASE_URL}/auth/login", "POST", shipper_login_payload)
    assert status_code == 200, f"Shipper login failed: {shipper_login_res}"
    assert shipper_login_res["role"] == "shipper"
    print("[OK] STEP 5: Login Shipper - SUCCESS (Role: shipper)")

    # 6. Verify Role Restrictions (Shipper attempting to access Driver-only matches route -> 403 Forbidden)
    status_code, restricted_res = make_request(f"{BASE_URL}/matches", "POST", route_payload, token=shipper_token)
    assert status_code == 403, f"Role restriction test failed! Expected HTTP 403, got {status_code}: {restricted_res}"
    print(f"[OK] STEP 6: Verify Role Restrictions - SUCCESS (Shipper access to Driver endpoint rejected with HTTP 403: {restricted_res['detail']})")

    # 7. Logout Driver & Shipper
    status_code, logout_res = make_request(f"{BASE_URL}/auth/logout", "POST", token=shipper_token)
    assert status_code == 200
    print("[OK] STEP 7: Logout - SUCCESS")

    print("\nALL 7 AUTHENTICATION & ROLE RESTRICTION TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_tests()
