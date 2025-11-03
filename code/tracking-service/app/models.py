# code/tracking-service/app/models.py
from sqlalchemy import Column, Integer, Float, String, Boolean, Date, ForeignKey
from .db import Base
from datetime import date

class DailyTracking(Base):
    __tablename__ = "daily_tracking"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True)
    day = Column(String, nullable=False)
    date = Column(Date, default=date.today)
    meal_morning_done = Column(Boolean, default=False)
    meal_noon_done = Column(Boolean, default=False)
    meal_evening_done = Column(Boolean, default=False)
    workout_done = Column(Boolean, default=False)
    compliance_rate = Column(Float, default=0.0)
