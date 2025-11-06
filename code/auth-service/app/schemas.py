from pydantic import BaseModel, EmailStr
from typing import Optional

# ----------------------------
# 🔹 Schemas utilisateurs
# ----------------------------
class UserBase(BaseModel):
    email: EmailStr
    role: str = "client"
    coach_id: Optional[int] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "client"  # par défaut client


class UserOut(UserBase):
    id: int

    class Config:
        orm_mode = True


# ----------------------------
# 🔹 Authentification
# ----------------------------
class Login(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
