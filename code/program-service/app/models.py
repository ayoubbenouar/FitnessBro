# app/models.py
from sqlalchemy import Column, Integer, String, Float, Text
from sqlalchemy.dialects.postgresql import JSONB
from .db import Base


class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, nullable=False, index=True)
    client_id = Column(Integer, nullable=False, index=True)

    title = Column(String, nullable=False)
    notes = Column(Text, nullable=True)

    # JSONB robuste pour repas + exercices + sets
    days = Column(JSONB, nullable=False)

    # total calories de la semaine
    calories = Column(Float, default=0.0)
