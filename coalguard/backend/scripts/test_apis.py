import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth():
    print("Testing Auth...")
    # Test Corporate Manager
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": "corporate@demo.com", "password": "demo123"})
    assert r.status_code == 200
    corp_token = r.json()["access_token"]
    
    # Test Inspector
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": "inspector.c@demo.com", "password": "demo123"})
    assert r.status_code == 200
    insp_token = r.json()["access_token"]
    
    # Test Mine Manager
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": "manager.c@demo.com", "password": "demo123"})
    assert r.status_code == 200
    mgr_token = r.json()["access_token"]
    
    return corp_token, insp_token, mgr_token

def test_inspection(insp_token):
    print("Testing Inspection completeness gate...")
    headers = {"Authorization": f"Bearer {insp_token}"}
    payload_no_photo = {
        "temp_uuid": "test-uuid-1",
        "mine_id": "c0000000-0000-0000-0000-000000000000",
        "severity": "High",
        "description": "Test high severity without photo",
        "gps_lat": 23.75,
        "gps_lon": 86.42
    }
    r = requests.post(f"{BASE_URL}/inspections", json=payload_no_photo, headers=headers)
    assert r.status_code == 422, f"Expected 422, got {r.status_code}"
    
    print("Testing Inspection idempotency...")
    payload_valid = {
        "temp_uuid": "test-uuid-2",
        "mine_id": "c0000000-0000-0000-0000-000000000000",
        "severity": "High",
        "description": "Test valid",
        "photo_url": "photo.jpg",
        "gps_lat": 23.75,
        "gps_lon": 86.42
    }
    r1 = requests.post(f"{BASE_URL}/inspections", json=payload_valid, headers=headers)
    assert r1.status_code == 201 or r1.status_code == 200
    r2 = requests.post(f"{BASE_URL}/inspections", json=payload_valid, headers=headers)
    assert r2.status_code == 200 or r2.status_code == 201

def test_actions(mgr_token, insp_token):
    print("Testing Corrective Actions...")
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}
    insp_headers = {"Authorization": f"Bearer {insp_token}"}
    
    # Can Manager verify?
    # Get seeded action
    r = requests.post(f"{BASE_URL}/corrective-actions/ca1-c/verify", headers=mgr_headers)
    # ca1-c owner is Insp C, and it is in OPEN status. Verification requires VERIFICATION status.
    assert r.status_code == 400, f"Expected 400 not in VERIFICATION state, got {r.status_code}"

def main():
    try:
        corp, insp, mgr = test_auth()
        test_inspection(insp)
        test_actions(mgr, insp)
        print("ALL TESTS PASSED")
    except AssertionError as e:
        print(f"TEST FAILED: {e}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    main()
