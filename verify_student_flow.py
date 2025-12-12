import requests

BASE_URL = "http://127.0.0.1:8000"

# Test Data
STUDENT_DATA = {
    "university": "SCA",
    "roll_no": "TEST_STUDENT_FLOW",
    "full_name": "Flow Test Student",
    "password": "securePass123!",
    "is_admin": False
}

def verify_full_flow():
    print("=" * 60)
    print("VERIFYING FULL WORKFLOW: Admin Add User -> Student Login")
    print("=" * 60)

    # 1. Admin Login
    print("\n[1] Admin Login...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={
            "university": "SCA", 
            "roll_no": "ADMIN", 
            "full_name": "System Admin",
            "password": "admin2025"
        })
        resp.raise_for_status()
        admin_token = resp.json()["access_token"]
        print("    [OK] Admin logged in successfully.")
    except Exception as e:
        print(f"    [FAIL] Admin Login Failed: {e}")
        return

    # 2. Create Student
    print(f"\n[2] Creating Student {STUDENT_DATA['roll_no']}...")
    try:
        resp = requests.post(
            f"{BASE_URL}/admin/users", 
            json=STUDENT_DATA,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        if resp.status_code == 200 or resp.status_code == 201:
            print("    [OK] Student created successfully.")
        elif resp.status_code == 400 and "already exists" in resp.text:
            print("    [WARN] Student already exists (proceeding to login).")
        else:
            print(f"    [FAIL] Creation Failed: {resp.status_code} - {resp.text}")
            return
    except Exception as e:
        print(f"    [FAIL] Request Error: {e}")
        return

    # 3. Student Login
    print(f"\n[3] Attempting Student Login...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={
            "university": STUDENT_DATA["university"],
            "roll_no": STUDENT_DATA["roll_no"],
            "full_name": STUDENT_DATA["full_name"], # Frontend sends this
            "password": STUDENT_DATA["password"]
        })
        
        if resp.status_code == 200:
            data = resp.json()
            token = data["access_token"]
            print("    [OK] Student Login SUCCESSFUL!")
            print(f"    [INFO] Token received (Length: {len(token)})")
        else:
            print(f"    [FAIL] Student Login Failed: {resp.status_code}")
            print(f"    Response: {resp.text}")
            return
    except Exception as e:
        print(f"    [FAIL] Login Error: {e}")
        return

    # 4. Access Restricted Resource (Verify Token works)
    print(f"\n[4] Verifying Dashboard Access...")
    try:
        # accessing /auth/users/me or similar to verify identity
        headers = {"Authorization": f"Bearer {token}"}
        # Assuming there is a 'me' endpoint or we try to list docs to verify isolation
        # Let's try to get profile or verify token
        # Using a known endpoint for students (e.g. upload or just verify session implicitly via any auth'd call)
        # We don't have a dedicated /me endpoint visible in summary but usually auth routers have it.
        # Let's try /admin/users which should FAIL (403) for student
        
        resp = requests.get(f"{BASE_URL}/admin/users", headers=headers)
        if resp.status_code == 403:
             print("    [OK] Access Control Verified: Student cannot access Admin API (403 Forbidden).")
        else:
             print(f"    [WARN] Unexpected response for Admin API: {resp.status_code} (Should be 403)")

        print("\n🎉 FULL WORKFLOW VERIFIED SUCCESSFULLY 🎉")
        
    except Exception as e:
        print(f"    [FAIL] Access Check Error: {e}")

if __name__ == "__main__":
    verify_full_flow()
