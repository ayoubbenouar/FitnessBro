# app/schemas.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ============================
# 🔹 Profil client (Pydantic)
# ============================

class ProfileBase(BaseModel):
    age: Optional[int] = None
    sex: Optional[str] = None  # "male" / "female"
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    target_weight_kg: Optional[float] = None

    goal: Optional[str] = None
    activity_level: Optional[str] = None
    experience_level: Optional[str] = None

    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    food_preferences: Optional[str] = None

    note: Optional[str] = None


class ProfileCreate(ProfileBase):
    """
    Création / mise à jour : on autorise tout en option,
    le back se charge de compléter ce qu'il peut.
    """
    pass


class ProfileUpdate(ProfileBase):
    """
    PATCH sémantique : uniquement les champs fournis seront mis à jour.
    """
    pass


class ProfileOut(ProfileBase):
    id: int
    client_id: int
    bmr: Optional[float] = None
    tdee: Optional[float] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Pydantic v2 (remplace orm_mode)


# ============================
# 🔵 Weight history
# ============================

class WeightEntryBase(BaseModel):
    weight_kg: float
    date: Optional[date] = None  # si None → aujourd'hui


class WeightEntryCreate(WeightEntryBase):
    pass


class WeightEntryOut(WeightEntryBase):
    id: int
    client_id: int
    date: date

    class Config:
        from_attributes = True
