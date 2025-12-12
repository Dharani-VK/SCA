
import os
import requests
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GROQ_API_KEY")
model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")

print(f"Key present: {bool(key)}")
print(f"Model: {model}")

if not key:
    print("No key!")
    exit(1)

headers = {
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}
data = {
    "model": model,
    "messages": [{"role": "user", "content": "Hello json"}],
    "max_tokens": 100
}

try:
    print("Sending request...")
    resp = requests.post("https://api.groq.com/openai/v1/chat/completions", json=data, headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
