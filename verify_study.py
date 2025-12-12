
import os
import time
import requests

from uuid import uuid4

# Load env manually just in case
from dotenv import load_dotenv
load_dotenv("backend/.env")

BASE_URL = "http://127.0.0.1:8000"

def get_auth_token():
    # Login as a test user
    # Assume user exists from previous interactions or creating one
    # For strictness, let's create a ephemeral one directly in DB or use existing
    # We'll try to login as the 'Welcome' user if possible, or '201' from earlier
    payload = {"university": "SCA", "roll_no": "201", "password": "smart2025"}
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json=payload)
        if resp.status_code == 200:
            return resp.json()["access_token"]
    except:
        pass
    
    # Fallback: create fresh user
    uid = f"auto_{uuid4().hex[:8]}"
    requests.post(f"{BASE_URL}/auth/register", json={
        "full_name": "Auto Tester",
        "university": "TEST_UNI",
        "roll_no": uid,
        "password": "password123"
    })
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "university": "TEST_UNI",
        "roll_no": uid,
        "password": "password123"
    })
    return resp.json()["access_token"]

def test_summary_generation():
    print("Getting Token...")
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Requesting Summary...")
    # We need a topic. "Photosynthesis" is generic.
    resp = requests.post(f"{BASE_URL}/study-studio/summarize", 
                         json={"topic": "Deep Learning", "style": "medium"},
                         headers=headers)
    if resp.status_code != 200:
        print(f"Failed to create: {resp.text}")
        return
        
    data = resp.json()
    pk = data["id"]
    print(f"Summary ID: {pk} (Status: {data['status']})")
    
    # Poll
    for i in range(20):
        time.sleep(2)
        r = requests.get(f"{BASE_URL}/study-studio/summary/{pk}", headers=headers)
        if r.status_code == 200:
            s = r.json()
            print(f"Poll {i}: {s['status']}")
            if s['status'] in ['ready', 'error']:
                print(f"Final Result: {s['status']}")
                if s['status'] == 'ready':
                    print(f"Summary Text Length: {len(s.get('summary_text', ''))}")
                    print(f"Concepts: {s.get('key_concepts')}")
                else:
                    print(f"Error Message: {s.get('summary_text')}")
                break
        else:
            print("Get failed")

if __name__ == "__main__":
    test_summary_generation()
