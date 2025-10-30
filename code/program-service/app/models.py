from sqlalchemy import Column, Integer, String, Float, Text, JSON
from .db import Base

class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, nullable=False)
    client_id = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    notes = Column(Text)
    days = Column(JSON)  # on stocke tout le plan hebdomadaire ici
    calories = Column(Float, default=0.0)
