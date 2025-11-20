# app/security.py
import os
from dotenv import load_dotenv
from jose import jwt, JWTError
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALG = "HS256"
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MIN", 60))

auth_scheme = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    """
    Vérifie le token JWT envoyé par le client.
    Retourne un dict {user_id, role}.
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])

        user_id = payload.get("sub")
        role = payload.get("role")

        if not user_id:
            raise HTTPException(401, "Token invalide : 'sub' manquant")

        return {"user_id": int(user_id), "role": role}

    except JWTError:
        raise HTTPException(401, "Token invalide ou expiré")
