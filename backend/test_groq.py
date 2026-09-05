import os
import requests
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GROQ_API_KEY")
print(f"Loaded GROQ_API_KEY: {key[:10]}... (length: {len(key) if key else 0})")

res = requests.get(
    "https://api.groq.com/openai/v1/models",
    headers={"Authorization": f"Bearer {key}"}
)

if res.status_code == 200:
    models = [m["id"] for m in res.json().get("data", [])]
    print("\n--- Available Groq Models for your key ---")
    for m in models:
        print(f"- {m}")
else:
    print(f"Error {res.status_code}: {res.text}")