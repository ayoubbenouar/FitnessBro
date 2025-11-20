# app/security.py
"""
Vérification du token JWT envoyé par le frontend.
Ce service doit utiliser la même SECRET_KEY et l'algorithme
que l'auth-service pour pouvoir décoder les tokens.
"""

import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALG = "HS256"
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MIN", 60))

# Schéma d'authentification "Bearer <token>"
security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Vérifie et décode le token JWT.
    Retourne un dict avec l'ID et le rôle de l'utilisateur.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])

        user_id = payload.get("sub")
        role = payload.get("role")

        if user_id is None or role is None:
            raise HTTPException(status_code=401, detail="Token incomplet ou invalide")

        return {"user_id": int(user_id), "role": role}

    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
