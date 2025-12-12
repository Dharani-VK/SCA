import requests
try:
    # Try wrapping
    resp = requests.post("http://127.0.0.1:8000/auth/login", json={"login_data": {"university": "SCA", "roll_no": "ADMIN", "password": "admin2025"}})
    print("Wrapped:", resp.status_code)
    
    # Try flat
    resp = requests.post("http://127.0.0.1:8000/auth/login", json={"university": "SCA", "roll_no": "ADMIN", "password": "admin2025"})
    print("Flat:", resp.status_code)
    
except Exception as e:
    print(e)
