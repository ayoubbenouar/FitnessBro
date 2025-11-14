# app/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional

# ----------------------------
# Base utilisateur
# ----------------------------
class UserBase(BaseModel):
    email: EmailStr
    role: str = "client"
    coach_id: Optional[int] = None


# ----------------------------
# Création
# ----------------------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "client"


# ----------------------------
# Sortie
# ----------------------------
class UserOut(UserBase):
    id: int

    class Config:
        orm_mode = True


# ----------------------------
# Auth
# ----------------------------
class Login(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
