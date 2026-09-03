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

def run_matching_tests():
    print("=== ROUTENOVA SMART MATCHING ENGINE TEST SUITE ===")
    unique_suffix = uuid.uuid4().hex[:6]
    
    # 1. Register Driver
    driver_email = f"match_driver_{unique_suffix}@routenova.in"
    _, d_reg = make_request(f"{BASE_URL}/auth/register", "POST", {
        "name": "Match Driver Suresh", "email": driver_email, "phone": "+91 9876543210",
        "password": "password123", "role": "driver"
    })
    driver_token = d_reg["access_token"]
    print("[OK] Driver Authenticated")

    # 2. Query GET /api/matches (Default Best Match sort)
    query_url = f"{BASE_URL}/matches?sort_by=match_score&curr_lat=12.9716&curr_lng=77.5946&dest_lat=12.5218&dest_lng=76.8951&available_capacity=400.0&truck_capacity=500.0"
    status, matches_res = make_request(query_url, "GET", token=driver_token)
    assert status == 200, f"GET /api/matches failed: {matches_res}"
    assert len(matches_res) > 0, "No matches returned"

    top = matches_res[0]
    print(f"\n--- Top Recommended Match ---")
    print(f"Match Score: {top['match_score']}%")
    print(f"Recommendation: {top['recommendation']}")
    print(f"Reason: {top['reason']}")
    print(f"Estimated Detour: {top['estimated_detour_km']} km")
    print(f"Estimated Earnings: ₹{top['estimated_earnings']}")
    print(f"Fuel Saved: {top['fuel_saved_liters']} L")
    print(f"CO2 Avoided: {top['co2_saved_kg']} kg")

    # Validate output structure matches specification
    assert "match_score" in top
    assert "recommendation" in top
    assert "reason" in top
    assert "estimated_detour_km" in top
    assert "estimated_earnings" in top
    assert "fuel_saved_liters" in top
    assert "co2_saved_kg" in top
    assert "capacity_used_pct" in top
    print("[OK] STEP 1: Output structure matches specification")

    # 3. Test Sorting Options
    # Sort by Highest Earnings
    _, earnings_sorted = make_request(f"{BASE_URL}/matches?sort_by=earnings", "GET", token=driver_token)
    earnings_list = [m["estimated_earnings"] for m in earnings_sorted]
    assert earnings_list == sorted(earnings_list, reverse=True)
    print(f"[OK] STEP 2: Sort by Earnings - SUCCESS ({earnings_list})")

    # Sort by Lowest Detour
    _, detour_sorted = make_request(f"{BASE_URL}/matches?sort_by=detour", "GET", token=driver_token)
    detour_list = [m["estimated_detour_km"] for m in detour_sorted]
    assert detour_list == sorted(detour_list)
    print(f"[OK] STEP 3: Sort by Lowest Detour - SUCCESS ({detour_list})")

    print("\n🎉 SMART MATCHING ENGINE DETERMINISTIC TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_matching_tests()
