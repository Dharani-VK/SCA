"""
Upload Queue Isolation Test
Tests that upload queue is properly isolated between different users.
"""

import requests
import sys
from pathlib import Path

BASE_URL = "http://localhost:8000"

# Test users
USER_A = {
    "university": "SCA",
    "roll_no": "UPLOAD_TEST_A",
    "full_name": "Upload Test User A",
    "password": "smart2025"
}

USER_B = {
    "university": "SCA",
    "roll_no": "UPLOAD_TEST_B",
    "full_name": "Upload Test User B",
    "password": "smart2025"
}

ADMIN_USER = {
    "university": "SCA",
    "roll_no": "ADMIN",
    "full_name": "Admin",
    "password": "admin2025"
}


def login(user):
    """Login and return access token"""
    print(f"  Logging in as {user['roll_no']}...")
    resp = requests.post(f"{BASE_URL}/auth/login", json=user)
    if resp.status_code == 200:
        return resp.json()["access_token"]
    
    # Try registering if login failed
    print(f"  Registering {user['roll_no']}...")
    requests.post(f"{BASE_URL}/auth/register", json=user)
    resp = requests.post(f"{BASE_URL}/auth/login", json=user)
    if resp.status_code == 200:
        return resp.json()["access_token"]
    
    raise Exception(f"Failed to login as {user['roll_no']}: {resp.text}")


def upload_file(token, filename, content):
    """Upload a file"""
    headers = {"Authorization": f"Bearer {token}"}
    files = {"file": (filename, content)}
    resp = requests.post(f"{BASE_URL}/ingest-file", files=files, headers=headers)
    return resp.status_code, resp.json() if resp.status_code == 200 else resp.text


def get_documents(token):
    """Get user's documents"""
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/documents", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        return data.get("sources", []), data.get("total_docs", 0)
    return [], 0


def reset_system():
    """Reset the system (admin only)"""
    print("Resetting system...")
    token = login(ADMIN_USER)
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(f"{BASE_URL}/reset-store", headers=headers)
    print(f"  Reset status: {resp.status_code}")


def test_upload_queue_isolation():
    """
    Test upload queue isolation between users
    
    Scenario:
    1. User A uploads a document
    2. User A should see 1 document
    3. User B should see 0 documents (isolation verified)
    4. User B uploads a different document
    5. User B should see 1 document (their own)
    6. User A should still see 1 document (their own)
    """
    
    print("\n" + "="*70)
    print("UPLOAD QUEUE ISOLATION TEST")
    print("="*70)
    
    # Step 0: Reset system
    print("\n[Step 0] Resetting system...")
    try:
        reset_system()
    except Exception as e:
        print(f"  Warning: Could not reset system: {e}")
    
    # Step 1: User A uploads a document
    print("\n[Step 1] User A uploads document...")
    token_a = login(USER_A)
    status, result = upload_file(token_a, "user_a_notes.txt", "User A's secret notes")
    print(f"  Upload status: {status}")
    if status != 200:
        print(f"  ERROR: {result}")
        return False
    
    # Step 2: Verify User A sees their document
    print("\n[Step 2] Verify User A sees their document...")
    sources_a, count_a = get_documents(token_a)
    print(f"  User A sees {count_a} documents")
    if count_a != 1:
        print(f"  ❌ FAIL: Expected 1 document, got {count_a}")
        return False
    print(f"  ✅ PASS: User A sees exactly 1 document")
    
    # Step 3: User B should see 0 documents (ISOLATION TEST)
    print("\n[Step 3] Verify User B sees 0 documents (ISOLATION TEST)...")
    token_b = login(USER_B)
    sources_b, count_b = get_documents(token_b)
    print(f"  User B sees {count_b} documents")
    if count_b != 0:
        print(f"  ❌ FAIL: User B can see User A's documents! (ISOLATION BREACH)")
        print(f"  Sources: {sources_b}")
        return False
    print(f"  ✅ PASS: User B sees 0 documents (isolation verified)")
    
    # Step 4: User B uploads their own document
    print("\n[Step 4] User B uploads their own document...")
    status, result = upload_file(token_b, "user_b_notes.txt", "User B's secret notes")
    print(f"  Upload status: {status}")
    if status != 200:
        print(f"  ERROR: {result}")
        return False
    
    # Step 5: Verify User B sees only their document
    print("\n[Step 5] Verify User B sees only their document...")
    sources_b, count_b = get_documents(token_b)
    print(f"  User B sees {count_b} documents")
    if count_b != 1:
        print(f"  ❌ FAIL: Expected 1 document, got {count_b}")
        return False
    if "user_a_notes.txt" in [s["source"] for s in sources_b]:
        print(f"  ❌ FAIL: User B can see User A's document!")
        return False
    print(f"  ✅ PASS: User B sees only their own document")
    
    # Step 6: Verify User A still sees only their document
    print("\n[Step 6] Verify User A still sees only their document...")
    sources_a, count_a = get_documents(token_a)
    print(f"  User A sees {count_a} documents")
    if count_a != 1:
        print(f"  ❌ FAIL: Expected 1 document, got {count_a}")
        return False
    if "user_b_notes.txt" in [s["source"] for s in sources_a]:
        print(f"  ❌ FAIL: User A can see User B's document!")
        return False
    print(f"  ✅ PASS: User A sees only their own document")
    
    print("\n" + "="*70)
    print("✅ ALL TESTS PASSED - UPLOAD QUEUE ISOLATION VERIFIED")
    print("="*70)
    return True


if __name__ == "__main__":
    try:
        success = test_upload_queue_isolation()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ TEST FAILED WITH ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
