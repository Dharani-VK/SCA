import requests

def verify_student_name_retrieval():
    print("VERIFYING STUDENT NAME RETRIEVAL FROM LOGIN API...")
    
    # 1. Login as the Verified User created earlier
    try:
        resp = requests.post("http://127.0.0.1:8000/auth/login", json={
            "university": "SCA",
            "roll_no": "VERIFY_FINAL_999",
            # No full_name needed for login now
            "password": "TestPassword123!" 
        })
        
        if resp.status_code == 200:
            data = resp.json()
            user = data.get("user")
            
            print(f"    [OK] Login Successful.")
            if user:
                print(f"    [OK] USER OBJECT RECEIVED: {user}")
                name = user.get("full_name")
                if name == "Final Verification User":
                    print(f"    ✅ SUCCESS: Full Name '{name}' retrieved correctly!")
                else:
                    print(f"    ❌ FAILURE: Expected 'Final Verification User', got '{name}'")
            else:
                print("    ❌ FAILURE: 'user' object missing in response.")
                print(f"    Keys received: {data.keys()}")
        else:
            print(f"    ❌ LOGIN FAILED: {resp.status_code} {resp.text}")

    except Exception as e:
        print(f"    ❌ ERROR: {e}")

if __name__ == "__main__":
    verify_student_name_retrieval()
