# app/security.py
import datetime as dt
import jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALG = "HS256"
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MIN", 60))

# Contexte bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash / Vérification mot de passe

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


# Création d'un token JWT

def create_access_token(sub: str, role: str) -> str:
    expire = dt.datetime.utcnow() + dt.timedelta(minutes=JWT_EXPIRE_MIN)
    payload = {
        "sub": sub,   # identifiant utilisateur
        "role": role, # rôle coach/client
        "exp": expire # expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
