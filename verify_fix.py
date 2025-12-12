import requests
import sqlite3
import os

BASE_URL = "http://127.0.0.1:8000"
DB_PATH = "backend/analytics.db" # The CORRECT DB path

def test_add_user():
    print("=" * 60)
    print("FINAL VERIFICATION: Add User API + Database Check")
    print("=" * 60)

    # 1. Login as Admin
    print(f"\n[1] Logging in as Admin (SCA/ADMIN)...")
    try:
        login_resp = requests.post(f"{BASE_URL}/auth/login", json={
            "university": "SCA",
            "roll_no": "ADMIN",
            "password": "admin2025"
        })
        login_resp.raise_for_status()
        token = login_resp.json()["access_token"]
        print("    [OK] Login Successful. Token acquired.")
    except Exception as e:
        print(f"    [FAIL] Login Failed: {e}")
        if 'login_resp' in locals(): print(f"    Response: {login_resp.text}")
        return

    # 2. Add New User
    TEST_USER = {
        "university": "SCA",
        "roll_no": "VERIFY_FINAL_999",
        "full_name": "Final Verification User",
        "password": "TestPassword123!", # Normal password
        "is_admin": False
    }

    print(f"\n[2] Adding User {TEST_USER['roll_no']} via API...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        resp = requests.post(f"{BASE_URL}/admin/users", json=TEST_USER, headers=headers)
        
        if resp.status_code == 200 or resp.status_code == 201:
            print("    [OK] API Response: 200 OK (User Added)")
            print(f"    Message: {resp.json().get('message')}")
        elif resp.status_code == 400 and "already exists" in resp.text:
            print("    [WARN] User already exists (Skipping add, proceeding to check DB)")
        else:
            print(f"    [FAIL] API Failed: {resp.status_code}")
            print(f"    Response: {resp.text}")
            return
    except Exception as e:
        print(f"    [FAIL] Request Error: {e}")
        return

    # 3. Verify in Database
    print(f"\n[3] Direct Database Check ({DB_PATH})...")
    
    if not os.path.exists(DB_PATH):
        print(f"    [FAIL] FATAL: Database file not found at {DB_PATH}")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, university, roll_no, full_name, is_active FROM students WHERE roll_no = ?", (TEST_USER['roll_no'],))
        row = cursor.fetchone()
        
        if row:
            print(f"    [OK] SUCCESS: User found in Database!")
            print(f"    DATA: {row}")
            print("\n SYSTEM IS FULLY FUNCTIONAL ")
        else:
            print("    [FAIL] FAILURE: User NOT found in DB after 200 OK response.")
        conn.close()
    except Exception as e:
        print(f"    [FAIL] SQL Error: {e}")

if __name__ == "__main__":
    test_add_user()
