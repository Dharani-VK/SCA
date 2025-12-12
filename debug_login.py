import requests
try:
    resp = requests.post("http://127.0.0.1:8000/auth/login", json={"university": "SCA", "roll_no": "ADMIN", "password": "admin2025"})
    print(resp.text)
except Exception as e:
    print(e)
