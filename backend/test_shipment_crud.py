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

def run_crud_tests():
    print("=== ROUTENOVA SHIPMENT CRUD TEST SUITE ===")
    unique_suffix = uuid.uuid4().hex[:6]
    
    # 1. Register Shipper & Driver
    shipper_email = f"crud_shipper_{unique_suffix}@routenova.in"
    driver_email = f"crud_driver_{unique_suffix}@routenova.in"
    
    _, s_reg = make_request(f"{BASE_URL}/auth/register", "POST", {
        "name": "Kaveri Organic Farmers", "email": shipper_email, "phone": "+91 9876543210",
        "password": "password123", "role": "shipper"
    })
    shipper_token = s_reg["access_token"]
    
    _, d_reg = make_request(f"{BASE_URL}/auth/register", "POST", {
        "name": "Driver Suresh", "email": driver_email, "phone": "+91 9123456789",
        "password": "password123", "role": "driver"
    })
    driver_token = d_reg["access_token"]
    print("[OK] Auth Setup Completed (Shipper & Driver Registered)")

    # 2. CREATE Shipment (POST /api/shipments)
    new_shipment_data = {
        "name": "Fresh Organic Tomato Crates",
        "description": "Perishable produce, temperature sensitive",
        "package_type": "Wooden Crates (6x)",
        "weight": 180.0,
        "offered_price": 2400.0,
        "pickup_location": "Mandya APMC Yard",
        "destination": "Bengaluru KSRTC Depot",
        "pickup_coordinates": {"lat": 12.5218, "lng": 76.8951},
        "destination_coordinates": {"lat": 12.9716, "lng": 77.5946},
        "priority": "HIGH"
    }
    status, create_res = make_request(f"{BASE_URL}/shipments", "POST", new_shipment_data, token=shipper_token)
    assert status == 200, f"Create shipment failed: {create_res}"
    shipment_id = create_res["id"]
    assert create_res["status"] == "AVAILABLE"
    assert create_res["weight"] == 180.0
    assert create_res["offered_price"] == 2400.0
    print(f"[OK] STEP 1: CREATE Shipment - SUCCESS (ID: {shipment_id})")

    # 3. LIST Shipments (GET /api/shipments)
    status, list_res = make_request(f"{BASE_URL}/shipments", "GET", token=shipper_token)
    assert status == 200
    assert any(s["id"] == shipment_id for s in list_res)
    print(f"[OK] STEP 2: LIST Shipments - SUCCESS (Total Shipments: {len(list_res)})")

    # 4. GET Single Shipment (GET /api/shipments/{id})
    status, get_res = make_request(f"{BASE_URL}/shipments/{shipment_id}", "GET", token=shipper_token)
    assert status == 200
    assert get_res["name"] == "Fresh Organic Tomato Crates"
    assert get_res["pickup_location"] == "Mandya APMC Yard"
    print(f"[OK] STEP 3: GET Single Shipment - SUCCESS (Fetched name: '{get_res['name']}')")

    # 5. ACCEPT Shipment (POST /api/shipments/{id}/accept) as Driver
    status, accept_res = make_request(f"{BASE_URL}/shipments/{shipment_id}/accept", "POST", token=driver_token)
    assert status == 200
    assert accept_res["status"] == "ACCEPTED"
    assert accept_res["driver_name"] == "Driver Suresh"
    print(f"[OK] STEP 4: ACCEPT Shipment - SUCCESS (Status transitioned to ACCEPTED, Driver: {accept_res['driver_name']})")

    # 6. UPDATE Shipment Status (PUT /api/shipments/{id})
    status, update_res = make_request(f"{BASE_URL}/shipments/{shipment_id}", "PUT", {"status": "IN_TRANSIT"}, token=driver_token)
    assert status == 200
    assert update_res["status"] == "IN_TRANSIT"
    print(f"[OK] STEP 5: UPDATE Shipment Status - SUCCESS (Status transitioned to IN_TRANSIT)")

    # 7. UPDATE to DELIVERED & PAYMENT_RELEASED
    status, delivered_res = make_request(f"{BASE_URL}/shipments/{shipment_id}", "PUT", {"status": "DELIVERED"}, token=driver_token)
    assert status == 200
    assert delivered_res["status"] == "DELIVERED"
    print(f"[OK] STEP 6: ADVANCE to DELIVERED - SUCCESS")

    # 8. CREATE & DELETE Shipment (DELETE /api/shipments/{id})
    _, temp_shipment = make_request(f"{BASE_URL}/shipments", "POST", {
        "name": "Temporary Load to Delete", "package_type": "Box", "weight": 20.0, "offered_price": 500.0,
        "pickup_location": "A", "destination": "B", "priority": "LOW"
    }, token=shipper_token)
    temp_id = temp_shipment["id"]

    status, del_res = make_request(f"{BASE_URL}/shipments/{temp_id}", "DELETE", token=shipper_token)
    assert status == 200
    assert del_res["status"] == "success"
    print(f"[OK] STEP 7: DELETE Shipment - SUCCESS (Deleted temp ID: {temp_id})")

    print("\n🎉 ALL SHIPMENT CRUD FLOW TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_crud_tests()
