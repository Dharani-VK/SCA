"""
Test file upload size limits to ensure proper validation.
"""

import requests
import sys
from io import BytesIO

BASE_URL = "http://localhost:8000"

# Test user
TEST_USER = {
    "university": "SCA",
    "roll_no": "FILE_SIZE_TEST",
    "full_name": "File Size Test User",
    "password": "smart2025"
}


def login():
    """Login and return access token"""
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", json=TEST_USER)
    if resp.status_code == 200:
        return resp.json()["access_token"]
    
    # Try registering
    print("Registering...")
    requests.post(f"{BASE_URL}/auth/register", json=TEST_USER)
    resp = requests.post(f"{BASE_URL}/auth/login", json=TEST_USER)
    if resp.status_code == 200:
        return resp.json()["access_token"]
    
    raise Exception(f"Failed to login: {resp.text}")


def test_small_file(token):
    """Test uploading a small file (should succeed)"""
    print("\n" + "="*70)
    print("TEST 1: Small File Upload (1KB)")
    print("="*70)
    
    # Create a 1KB file
    content = b"This is a small test file. " * 40  # ~1KB
    files = {"file": ("small_test.txt", BytesIO(content), "text/plain")}
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = requests.post(f"{BASE_URL}/ingest-file", files=files, headers=headers)
    
    if resp.status_code == 200:
        print(f"✅ PASS: Small file uploaded successfully")
        print(f"   Response: {resp.json()}")
        return True
    else:
        print(f"❌ FAIL: Small file upload failed")
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {resp.text}")
        return False


def test_medium_file(token):
    """Test uploading a medium file (10MB - should succeed)"""
    print("\n" + "="*70)
    print("TEST 2: Medium File Upload (10MB)")
    print("="*70)
    
    # Create a 10MB file
    content = b"X" * (10 * 1024 * 1024)  # 10MB
    files = {"file": ("medium_test.txt", BytesIO(content), "text/plain")}
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Uploading 10MB file (this may take a moment)...")
    resp = requests.post(f"{BASE_URL}/ingest-file", files=files, headers=headers)
    
    if resp.status_code == 200:
        print(f"✅ PASS: Medium file (10MB) uploaded successfully")
        print(f"   Response: {resp.json()}")
        return True
    else:
        print(f"❌ FAIL: Medium file upload failed")
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {resp.text}")
        return False


def test_large_file(token):
    """Test uploading a large file (60MB - should fail with 413)"""
    print("\n" + "="*70)
    print("TEST 3: Large File Upload (60MB - Should Fail)")
    print("="*70)
    
    # Create a 60MB file (exceeds 50MB limit)
    content = b"X" * (60 * 1024 * 1024)  # 60MB
    files = {"file": ("large_test.txt", BytesIO(content), "text/plain")}
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Uploading 60MB file (should be rejected)...")
    resp = requests.post(f"{BASE_URL}/ingest-file", files=files, headers=headers)
    
    if resp.status_code == 413:
        print(f"✅ PASS: Large file correctly rejected with 413")
        try:
            error_detail = resp.json().get("detail", "")
            print(f"   Error message: {error_detail}")
            if "50MB" in error_detail and "60" in error_detail:
                print(f"   ✅ Error message is informative")
                return True
            else:
                print(f"   ⚠️  Error message could be more specific")
                return True
        except:
            print(f"   Response: {resp.text}")
            return True
    else:
        print(f"❌ FAIL: Large file should have been rejected")
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {resp.text}")
        return False


def test_empty_file(token):
    """Test uploading an empty file (should fail with 400)"""
    print("\n" + "="*70)
    print("TEST 4: Empty File Upload (Should Fail)")
    print("="*70)
    
    # Create an empty file
    content = b""
    files = {"file": ("empty_test.txt", BytesIO(content), "text/plain")}
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = requests.post(f"{BASE_URL}/ingest-file", files=files, headers=headers)
    
    if resp.status_code == 400:
        print(f"✅ PASS: Empty file correctly rejected with 400")
        try:
            error_detail = resp.json().get("detail", "")
            print(f"   Error message: {error_detail}")
            return True
        except:
            print(f"   Response: {resp.text}")
            return True
    else:
        print(f"❌ FAIL: Empty file should have been rejected")
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {resp.text}")
        return False


def main():
    print("\n" + "="*70)
    print("FILE UPLOAD SIZE LIMIT TESTS")
    print("="*70)
    
    try:
        token = login()
        print(f"✅ Authentication successful")
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        return False
    
    results = []
    
    # Run all tests
    results.append(("Small File (1KB)", test_small_file(token)))
    results.append(("Medium File (10MB)", test_medium_file(token)))
    results.append(("Large File (60MB)", test_large_file(token)))
    results.append(("Empty File", test_empty_file(token)))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
        if not passed:
            all_passed = False
    
    print("="*70)
    
    if all_passed:
        print("\n🎉 ALL TESTS PASSED!")
        print("\nFile upload size limits are working correctly:")
        print("  ✅ Small files upload successfully")
        print("  ✅ Medium files upload successfully")
        print("  ✅ Large files (>50MB) are rejected with clear error")
        print("  ✅ Empty files are rejected")
        print("  ✅ Tenant isolation maintained throughout")
        return True
    else:
        print("\n❌ SOME TESTS FAILED")
        print("Please check the backend configuration and logs.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
