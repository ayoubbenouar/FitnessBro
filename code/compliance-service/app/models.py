# app/models.py
from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from .db import Base

class ComplianceRecord(Base):
    __tablename__ = "compliance_records"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False)

    # JSONB pour les repas & workout
    daily_data = Column(JSONB, nullable=False)

    # Taux généré
    compliance_rate = Column(Float, nullable=False)

    # Date de création (timestamp)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
