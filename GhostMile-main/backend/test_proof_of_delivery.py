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

def run_proof_tests():
    print("=== ROUTENOVA DIGITAL PROOF OF DELIVERY TEST SUITE ===")
    unique_suffix = uuid.uuid4().hex[:6]
    
    # 1. Register Driver & Shipper
    d_email = f"proof_driver_{unique_suffix}@routenova.in"
    s_email = f"proof_shipper_{unique_suffix}@routenova.in"

    _, d_reg = make_request(f"{BASE_URL}/auth/register", "POST", {
        "name": "Proof Driver Ganesh", "email": d_email, "phone": "+91 9876543210",
        "password": "password123", "role": "driver"
    })
    driver_token = d_reg["access_token"]

    _, s_reg = make_request(f"{BASE_URL}/auth/register", "POST", {
        "name": "Proof Shipper Mandya APMC", "email": s_email, "phone": "+91 9123456789",
        "password": "password123", "role": "shipper"
    })
    shipper_token = s_reg["access_token"]
    print("[OK] Auth Setup Completed")

    # 2. Create Shipment
    _, shp = make_request(f"{BASE_URL}/shipments", "POST", {
        "name": "Mandya Organic Rice Bags", "package_type": "Gunnysacks", "weight": 250.0, "offered_price": 3200.0,
        "pickup_location": "Mandya Hub", "destination": "Bengaluru APMC", "priority": "HIGH"
    }, token=shipper_token)
    shipment_id = shp["id"]
    print(f"[OK] STEP 1: Shipment Created (ID: {shipment_id}, Status: AVAILABLE)")

    # 3. Accept Shipment
    status, accept_res = make_request(f"{BASE_URL}/shipments/{shipment_id}/accept", "POST", token=driver_token)
    assert status == 200
    assert accept_res["status"] == "ACCEPTED"
    print(f"[OK] STEP 2: Driver Accepted Shipment (Status: ACCEPTED)")

    # 4. POST /api/proofs/pickup
    pickup_payload = {
        "shipment_id": shipment_id,
        "photo_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
        "image_metadata": {"capture_mode": "DEMO_CAMERA_METADATA", "captured_by": "Proof Driver Ganesh"}
    }
    status, pkw_res = make_request(f"{BASE_URL}/proofs/pickup", "POST", pickup_payload, token=driver_token)
    assert status == 200, f"Pickup proof failed: {pkw_res}"
    assert pkw_res["new_shipment_status"] == "PICKED_UP"
    print(f"[OK] STEP 3 & 4: Capture Pickup Proof & Mark PICKED_UP - SUCCESS (Proof ID: {pkw_res['proof_id']})")

    # 5. Transition to IN_TRANSIT
    status, in_transit_res = make_request(f"{BASE_URL}/shipments/{shipment_id}", "PUT", {"status": "IN_TRANSIT"}, token=driver_token)
    assert status == 200
    assert in_transit_res["status"] == "IN_TRANSIT"
    print(f"[OK] STEP 5: Start Delivery Transit (Status: IN_TRANSIT)")

    # 6 & 7. POST /api/proofs/delivery & Generate QR
    del_payload = {
        "shipment_id": shipment_id,
        "photo_url": "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=600&q=80",
        "image_metadata": {"capture_mode": "DEMO_CAMERA_METADATA", "captured_by": "Proof Driver Ganesh"}
    }
    status, del_res = make_request(f"{BASE_URL}/proofs/delivery", "POST", del_payload, token=driver_token)
    assert status == 200, f"Delivery proof failed: {del_res}"
    assert del_res["new_shipment_status"] == "ARRIVED"
    verification_code = del_res["verification_code"]
    print(f"[OK] STEP 6 & 7: Capture Delivery Proof & Generate QR - SUCCESS (Code: {verification_code})")

    # 8, 9 & 10. POST /api/proofs/verify -> DELIVERED & PAYMENT_RELEASED
    verify_payload = {
        "shipment_id": shipment_id,
        "verification_code": verification_code,
        "verifier_name": "Bengaluru APMC Inspector"
    }
    status, verify_res = make_request(f"{BASE_URL}/proofs/verify", "POST", verify_payload, token=driver_token)
    assert status == 200, f"Verification failed: {verify_res}"
    assert verify_res["new_shipment_status"] == "PAYMENT_RELEASED"
    assert verify_res["escrow_released"] == True
    print(f"[OK] STEP 8, 9 & 10: Verify QR & Release Escrow - SUCCESS (Status: PAYMENT_RELEASED)")

    print("\n🎉 ALL 10 STEPS OF DIGITAL PROOF OF DELIVERY PASSED PERFECTLY!")

if __name__ == "__main__":
    run_proof_tests()
