from pydantic import BaseModel, EmailStr

# Données reçues lors de l'inscription
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "client"

# Données reçues lors du login
class Login(BaseModel):
    email: EmailStr
    password: str

# Données renvoyées après inscription ou lecture
class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str

    class Config:
        from_attributes = True  # Permet de lire depuis un modèle SQLAlchemy

# Token JWT renvoyé après connexion
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
