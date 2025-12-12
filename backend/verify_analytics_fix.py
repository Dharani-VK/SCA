import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def verify_analytics():
    print("1. Attempting login...")
    # Using the hardcoded access code from auth.py
    login_payload = {
        "university": "SCA",
        "roll_no": "test_user_analytics",
        "full_name": "Test User",
        "password": "smart2025" 
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} - {response.text}")
            return
            
        data = response.json()
        token = data["access_token"]
        print(f"Login successful. Token obtained.")
        
        # 2. Test Analytics URL with token param
        print("\n2. Requesting Analytics Page...")
        analytics_url = f"{BASE_URL}/analytics/quiz?token={token}&scope=session"
        
        # We need to simulate the student filter headers too, as dependencies might check them
        # BUT, the iframe approach relies on the token mostly. 
        # Let's see if the token in query param is enough for auth.
        
        # Note: The backend 'get_student_filter' dependency might still look for headers 
        # if it's used in the analytics endpoint.
        # Let's check the endpoint definition: 
        # @app.get("/analytics/quiz"... student_filter: Dict[str, Any] = Depends(get_student_filter))
        
        # The 'get_student_filter' typically decodes the token.
        # If 'get_current_user' is updated to check query params (which we did), 
        # and 'get_student_filter' relies on 'get_current_user' or does its own token check.
        # We need to be sure 'get_student_filter' is compatible.
        
        # Let's try the request
        headers = {
            # "Authorization": f"Bearer {token}" # Deliberately NOT sending header to test query param support
        }
        
        analytics_res = requests.get(analytics_url, headers=headers)
        
        print(f"Status Code: {analytics_res.status_code}")
        
        if analytics_res.status_code == 200:
            content = analytics_res.text
            print("\nResponse Content Analysis:")
            if "plotly" in content.lower() or "include_plotlyjs" in content:
                print("✅ Plotly reference found.")
            else:
                print("❌ Plotly reference NOT found.")
                
            if "Quiz Performance Insights" in content:
                 print("✅ Page title found.")
                 
            if "Not authenticated" in content:
                print("❌ 'Not authenticated' error found in content (unexpected for 200 OK).")
            else:
                print("✅ Auth successful (no error message).")
                
            # Check for the embedded JS
            if "window.PLOTLYENV" in content or "newPlot" in content:
                 print("✅ Plotly graph initialization found.")
            
        else:
            print("❌ Request failed.")
            print(analytics_res.text[:500])

    except Exception as e:
        print(f"Error during verification: {e}")

if __name__ == "__main__":
    verify_analytics()
