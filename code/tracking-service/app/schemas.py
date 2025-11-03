# code/tracking-service/app/schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import date

class TrackingBase(BaseModel):
    day: str
    meal_morning_done: bool = False
    meal_noon_done: bool = False
    meal_evening_done: bool = False
    workout_done: bool = False

class TrackingCreate(TrackingBase):
    client_id: int

class TrackingUpdate(TrackingBase):
    pass

class TrackingOut(TrackingBase):
    id: int
    client_id: int
    date: date
    compliance_rate: float

class Config:
    from_attributes = True

