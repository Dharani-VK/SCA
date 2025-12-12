import requests
import sys

BASE_URL = "http://localhost:8000"

DEV_USER = {"university": "SCA", "roll_no": "DEV_ISOLATION_TEST", "full_name": "Dev", "password": "smart2025"}
AMIR_USER = {"university": "SCA", "roll_no": "AMIR_ISOLATION_TEST", "full_name": "Amir", "password": "smart2025"}
ADMIN_USER = {"university": "SCA", "roll_no": "ADMIN", "full_name": "Admin", "password": "admin2025"}

def login(user):
    # Try login first
    resp = requests.post(f"{BASE_URL}/auth/login", json=user)
    if resp.status_code == 200:
        return resp.json()["access_token"]
    # Register if needed
    requests.post(f"{BASE_URL}/auth/register", json=user)
    resp = requests.post(f"{BASE_URL}/auth/login", json=user)
    if resp.status_code == 200:
        return resp.json()["access_token"]
    raise Exception(f"Auth failed for {user['roll_no']}")

def test():
    print("::: STARTING BIDIRECTIONAL ISOLATION TEST :::")
    
    # 1. Admin Reset
    print("1. Logging in as Admin...")
    try:
        token_admin = login(ADMIN_USER)
        # We need to wipe potential clean state to be rigorous
        requests.post(f"{BASE_URL}/reset-store", headers={"Authorization": f"Bearer {token_admin}"})
        print("   System Reset Complete.")
    except Exception as e:
        print(f"FATAL: Admin operations failed: {e}")
        return

    # 2. Dev Upload
    print("2. Login Dev & Upload...")
    token_dev = login(DEV_USER)
    files = {"file": ("dev_secret.txt", "This is secret data from Dev.")}
    ingest_resp = requests.post(f"{BASE_URL}/ingest-file", files=files, headers={"Authorization": f"Bearer {token_dev}"})
    print(f"   Upload Status: {ingest_resp.status_code}")
    
    # Verify Dev sees it
    r = requests.get(f"{BASE_URL}/documents", headers={"Authorization": f"Bearer {token_dev}"})
    count_dev = r.json().get("total_docs", 0)
    print(f"   Dev sees {count_dev} documents. (Expected > 0)")
    
    # 3. Amir Check (The reported issue - "amin sapce" = "Amir space"?)
    print("3. Login Amir & Check...")
    token_amir = login(AMIR_USER)
    r = requests.get(f"{BASE_URL}/documents", headers={"Authorization": f"Bearer {token_amir}"})
    count_amir = r.json().get("total_docs", 0)
    print(f"   Amir sees {count_amir} documents.")
    
    if count_amir == 0:
        print("   >>> PASS: Amir cannot see Dev's files.")
    else:
        print("   >>> FAIL: Amir CAN see Dev's files!")

    # 4. Admin Check (Document View - "amin sapce" = "Admin space"?)
    print("4. Admin Check (Document View)...")
    r = requests.get(f"{BASE_URL}/documents", headers={"Authorization": f"Bearer {token_admin}"})
    count_admin = r.json().get("total_docs", 0)
    print(f"   Admin sees {count_admin} documents via /documents endpoint.")
    
    if count_admin == 0:
         print("   >>> PASS: Admin cannot see Dev's files via /documents (Strict User Isolation).")
    else:
         print("   >>> FAIL?: Admin sees Dev's files via /documents.")

    print("::: TEST COMPLETE :::")

if __name__ == "__main__":
    test()
