import os
import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET = os.getenv("JWT_SECRET", "a-very-secure-random-string-for-jwt")

def verify_google_token(token: str):
    try:
        # Verifies the token cryptographically with Google's servers
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        return idinfo
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

def create_jwt_token(user_id: str):
    expiration = datetime.utcnow() + timedelta(days=7)
    payload = {"sub": str(user_id), "exp": expiration}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")