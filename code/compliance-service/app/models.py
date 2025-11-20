# app/models.py
from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from .db import Base


class ComplianceRecord(Base):
    """
    Historique des calculs de conformité (repas + entraînement).
    Permet de garder une trace des journées calculées.
    """
    __tablename__ = "compliance_records"

    id = Column(Integer, primary_key=True, index=True)

    # Client concerné
    client_id = Column(Integer, nullable=False)

    # Données brutes de la journée (repas / workout) sous forme JSON
    daily_data = Column(JSONB, nullable=False)

    # Taux de conformité calculé (%)
    compliance_rate = Column(Float, nullable=False)

    # Date de création en base
    created_at = Column(DateTime(timezone=True), server_default=func.now())
