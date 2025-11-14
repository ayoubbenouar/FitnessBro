from pydantic import BaseModel
from typing import List

class DailyEntry(BaseModel):
    meal_morning_done: bool
    meal_noon_done: bool
    meal_evening_done: bool
    workout_done: bool


class ComplianceResult(BaseModel):
    compliance_rate: float


class WeeklySummary(BaseModel):
    client_id: int
    average_compliance: float
    daily_rates: List[float]


class ComplianceRecordCreate(BaseModel):
    client_id: int
    daily_data: DailyEntry
    compliance_rate: float

    class Config:
        from_attributes = True
