import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def verify():
    # Login
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={
            "university": "SCA", "roll_no": "201", "full_name": "Test", "password": "smart2025"
        })
        token = resp.json().get("access_token")
        if not token:
            print("FAIL: No token")
            return
        
        print("LOGIN: OK")
        
        # Requests
        url = f"{BASE_URL}/analytics/quiz?token={token}&scope=session"
        resp = requests.get(url)
        print(f"STATUS: {resp.status_code}")
        
        content = resp.text
        if "Interactive charts require Plotly" in content:
            print("FAIL: Plotly not detected by app")
        
        if "main-svg" in content or "plotly-graph-div" in content:
             print("GRAPH_DIV: Found")
             
        if "window.PLOTLYENV" in content:
            print("PLOTLY_ENV: Found")
            
        print(f"Content length: {len(content)}")
        
        if len(content) > 100000:
             print("SUCCESS: Content is large (likely includes Plotly JS)")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    verify()
