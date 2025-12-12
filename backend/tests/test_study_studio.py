
import pytest
from app.main import app
from app.routers.auth import get_db_connection
from fastapi.testclient import TestClient
from uuid import uuid4

client = TestClient(app)

# Helper to clear DB
def clear_db():
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM summaries")
        conn.commit()
    finally:
        conn.close()

def get_auth_headers(client):
    # Register/Login flow
    user_id = f"test_{uuid4()}"
    client.post("/auth/login", json={
        "university": "SCA", 
        "roll_no": user_id, 
        "password": "smart2025"
    })
    # Login to get token
    resp = client.post("/auth/login", json={
        "university": "SCA", 
        "roll_no": user_id, 
        "password": "smart2025"
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_study_studio_flow():
    clear_db()
    headers = get_auth_headers(client)
    
    # 1. Create Summary (POST)
    payload = {
        "topic": "Neural Networks",
        "style": "medium",
        "request_audio": False
    }
    resp = client.post("/study-studio/summarize", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert data["status"] == "pending"
    summary_id = data["id"]
    
    # 2. Get Summary (GET) - Pending state
    resp = client.get(f"/study-studio/summary/{summary_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == summary_id
    assert resp.json()["topic"] == "Neural Networks"
    
    # 3. Followup
    f_payload = {
        "summary_id": summary_id,
        "action": "simplify"
    }
    resp = client.post("/study-studio/summarize/followup", json=f_payload, headers=headers)
    assert resp.status_code == 200
    assert "response" in resp.json()

def test_isolation():
    # User A
    headers_a = get_auth_headers(client)
    resp_a = client.post("/study-studio/summarize", json={"topic": "A's Topic"}, headers=headers_a)
    id_a = resp_a.json()["id"]
    
    # User B
    headers_b = get_auth_headers(client)
    
    # B try to access A's summary
    resp_b = client.get(f"/study-studio/summary/{id_a}", headers=headers_b)
    assert resp_b.status_code == 404 # Should not be found due to filter
