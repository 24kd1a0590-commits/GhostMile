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

def run_environment_tests():
    print("=== ROUTENOVA ENVIRONMENTAL IMPACT ENGINE TEST SUITE ===")
    unique_suffix = uuid.uuid4().hex[:6]
    
    # 1. Register User & Authenticate
    email = f"env_user_{unique_suffix}@routenova.in"
    _, reg = make_request(f"{BASE_URL}/auth/register", "POST", {
        "name": "Env Tester", "email": email, "phone": "+91 9876543210",
        "password": "password123", "role": "admin"
    })
    token = reg["access_token"]
    print("[OK] User Authenticated")

    # 2. Query GET /api/analytics/environmental (Default Assumptions: 8.5 km/L, 2.68 kg CO2/L)
    status, env_res = make_request(f"{BASE_URL}/analytics/environmental", "GET", token=token)
    assert status == 200, f"GET /api/analytics/environmental failed: {env_res}"

    print(f"\n--- Environmental Impact Metrics ---")
    print(f"Avoided Empty Distance: {env_res['avoided_empty_distance_km']} km")
    print(f"Fuel Saved: {env_res['fuel_saved_liters']} L")
    print(f"CO2 Avoided: {env_res['co2_saved_kg']} kg ({env_res['co2_saved_tonnes']} Tonnes)")
    print(f"Empty Trips Reduced: {env_res['empty_trips_reduced']} trips")
    print(f"Loads Consolidated: {env_res['loads_consolidated']} shipments")

    # Verify math formula determinism
    expected_fuel = round(env_res['avoided_empty_distance_km'] / 8.5, 2)
    expected_co2 = round(expected_fuel * 2.68, 2)
    assert env_res['fuel_saved_liters'] == expected_fuel
    assert env_res['co2_saved_kg'] == expected_co2
    print("[OK] STEP 1: Fuel & CO2 math formula verified with IPCC standards")

    # Verify Assumptions Object
    assert "assumptions" in env_res
    assump = env_res["assumptions"]
    assert assump["vehicle_fuel_efficiency_km_per_liter"] == 8.5
    assert assump["emission_factor_kg_per_liter"] == 2.68
    assert "IPCC" in assump["explanation"]
    print(f"[OK] STEP 2: Calculation assumptions logged with IPCC explanation: '{assump['explanation']}'")

    print("\n🎉 ENVIRONMENTAL IMPACT ENGINE TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_environment_tests()
