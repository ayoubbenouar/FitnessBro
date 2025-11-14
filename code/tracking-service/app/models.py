# app/models.py
from sqlalchemy import Column, Integer, Float, String, Boolean, Date, Index
from datetime import date
from .db import Base


class DailyTracking(Base):
    __tablename__ = "daily_tracking"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True, nullable=False)
    day = Column(String, nullable=False)
    date = Column(Date, default=date.today, nullable=False)

    # Champs repas & entraînement
    meal_morning_done = Column(Boolean, default=False)
    meal_noon_done = Column(Boolean, default=False)
    meal_evening_done = Column(Boolean, default=False)
    workout_done = Column(Boolean, default=False)

    # Taux de conformité
    compliance_rate = Column(Float, default=0.0)

    # Index pour les requêtes fréquentes
    __table_args__ = (
        Index("idx_tracking_client_day", "client_id", "day"),
    )

    def calculate_compliance(self):
        """Calcule le taux (%) d’adhérence de la journée."""
        total = 4
        done = sum(
            [
                bool(self.meal_morning_done),
                bool(self.meal_noon_done),
                bool(self.meal_evening_done),
                bool(self.workout_done),
            ]
        )
        self.compliance_rate = round((done / total) * 100, 2)
        return self.compliance_rate
