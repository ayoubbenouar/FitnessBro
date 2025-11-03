# code/tracking-service/app/security.py

from jose import jwt, JWTError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ⚠️ Cette clé et cet algorithme doivent être IDENTIQUES à ceux du auth-service
JWT_SECRET = "change-me"  # 🔒 même clé que dans auth-service/security.py
JWT_ALG = "HS256"

# Middleware d'authentification Bearer
auth_scheme = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    """
    Vérifie le token JWT et retourne le payload décodé.
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide : 'sub' manquant")
        return {"user_id": int(user_id)}  # ✅ on retourne un dict cohérent
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
