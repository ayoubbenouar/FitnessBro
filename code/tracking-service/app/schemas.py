from pydantic import BaseModel
from typing import Optional
from datetime import date


# Suivi repas / workout
class TrackingBase(BaseModel):
    day: str
    meal_morning_done: Optional[bool] = False
    meal_noon_done: Optional[bool] = False
    meal_evening_done: Optional[bool] = False
    workout_done: Optional[bool] = False


class TrackingOut(TrackingBase):
    id: int
    client_id: int
    date: date
    compliance_rate: float

    class Config:
        from_attributes = True


# Tracking des exercices
class ExerciseSetBase(BaseModel):
    day: str
    date: Optional[date] = None  # auto-rempli si null
    exercise_name: str
    set_index: int
    weight: Optional[float] = None


class ExerciseSetOut(ExerciseSetBase):
    id: int
    client_id: int
    date: date

    class Config:
        from_attributes = True
