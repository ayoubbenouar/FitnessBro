from jose import jwt, JWTError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ⚠️ Ces valeurs doivent être identiques à celles du auth-service
JWT_SECRET = "change-me"
JWT_ALG = "HS256"

auth_scheme = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    """
    Vérifie le token JWT envoyé dans les en-têtes Authorization.
    Retourne le payload s'il est valide.
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide : 'sub' manquant")
        return {"user_id": int(user_id)}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
