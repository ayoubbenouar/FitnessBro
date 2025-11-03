import datetime as dt
import jwt
from passlib.context import CryptContext

# Clé secrète (à changer en production)
JWT_SECRET = "change-me"
JWT_ALG = "HS256"
JWT_EXPIRE_MIN = 60  # durée de validité du token en minutes

# Gestion du hachage de mot de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

# ✅ Ajout du paramètre role
def create_access_token(sub: str, role: str) -> str:
    """
    Crée un token JWT contenant l'identifiant utilisateur et son rôle.
    """
    expire = dt.datetime.utcnow() + dt.timedelta(minutes=JWT_EXPIRE_MIN)
    payload = {
        "sub": sub,
        "role": role,  # 👈 inclure le rôle dans le token
        "exp": expire
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
