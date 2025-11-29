from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from .config import settings

security = HTTPBearer()


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
):
    token = creds.credentials
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALG],
        )
        # Auth-service met "sub" = id user, "role" = coach/client
        return {
            "id": int(payload["sub"]),
            "role": payload["role"],
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalide")
