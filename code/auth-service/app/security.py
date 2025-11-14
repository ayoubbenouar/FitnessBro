# app/security.py
import datetime as dt
import jwt
from passlib.context import CryptContext

JWT_SECRET = "change-me"
JWT_ALG = "HS256"
JWT_EXPIRE_MIN = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ----------------------------
# Password
# ----------------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

# ----------------------------
# Token
# ----------------------------
def create_access_token(sub: str, role: str) -> str:
    expire = dt.datetime.utcnow() + dt.timedelta(minutes=JWT_EXPIRE_MIN)
    payload = {"sub": sub, "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
