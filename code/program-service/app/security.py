from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

JWT_SECRET = "change-me"   # même clé que dans auth-service/security.py
JWT_ALG = "HS256"
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Vérifie et décode le token JWT.
    Retourne l'ID et le rôle de l'utilisateur.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = int(payload.get("sub"))
        role = payload.get("role")

        if user_id is None or role is None:
            raise HTTPException(status_code=401, detail="Token incomplet ou invalide")

        return {"user_id": user_id, "role": role}

    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
