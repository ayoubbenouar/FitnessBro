# app/schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import date

# -------------------------------------------------
# 🔹 Tracking repas / entraînement
# -------------------------------------------------
class TrackingBase(BaseModel):
    day: str
    meal_morning_done: Optional[bool] = False
    meal_noon_done: Optional[bool] = False
    meal_evening_done: Optional[bool] = False
    workout_done: Optional[bool] = False


class TrackingCreate(TrackingBase):
    client_id: int


class TrackingUpdate(BaseModel):
    day: str
    meal_morning_done: Optional[bool] = None
    meal_noon_done: Optional[bool] = None
    meal_evening_done: Optional[bool] = None
    workout_done: Optional[bool] = None


class TrackingOut(TrackingBase):
    id: int
    client_id: int
    date: date
    compliance_rate: float

    class Config:
        from_attributes = True


# -------------------------------------------------
# 🔵 Tracking des exercices (poids par série)
# -------------------------------------------------
class ExerciseSetBase(BaseModel):
    day: str  # "Lundi"
    date: Optional[date] = None  # 🔥 Pour regrouper par jour réel
    exercise_name: str
    set_index: int
    weight: Optional[float] = None


class ExerciseSetOut(ExerciseSetBase):
    id: int
    client_id: int
    date: date

    class Config:
        from_attributes = True
