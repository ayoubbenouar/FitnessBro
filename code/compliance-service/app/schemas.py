# app/schemas.py
from pydantic import BaseModel
from typing import List


class DailyEntry(BaseModel):
    """
    Représente une journée de suivi :
    - 3 repas
    - 1 entraînement
    """
    meal_morning_done: bool
    meal_noon_done: bool
    meal_evening_done: bool
    workout_done: bool


class ComplianceResult(BaseModel):
    """
    Résultat du calcul de conformité pour une journée.
    """
    compliance_rate: float


class WeeklySummary(BaseModel):
    """
    Résumé hebdomadaire :
    - client concerné
    - moyenne hebdo
    - liste des taux quotidiens
    """
    client_id: int
    average_compliance: float
    daily_rates: List[float]


class ComplianceRecordCreate(BaseModel):
    """
    Schéma théorique pour créer un enregistrement de conformité en DB.
    (Actuellement pas utilisé directement par une route.)
    """
    client_id: int
    daily_data: DailyEntry
    compliance_rate: float

    class Config:
        from_attributes = True
