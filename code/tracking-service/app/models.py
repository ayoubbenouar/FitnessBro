from sqlalchemy import (
    Column, Integer, Float, String, Boolean, Date, Index, UniqueConstraint
)
from datetime import date
from .db import Base


# ===============================================================
# 🟦 Modèle : Suivi quotidien (repas + entraînement)
# ===============================================================
class DailyTracking(Base):
    __tablename__ = "daily_tracking"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True, nullable=False)

    # Exemple : "Lundi", "Mardi"
    day = Column(String, nullable=False)

    # Date réelle du suivi (utile pour statistiques futures)
    date = Column(Date, default=date.today, nullable=False)

    # Coche repas
    meal_morning_done = Column(Boolean, default=False)
    meal_noon_done = Column(Boolean, default=False)
    meal_evening_done = Column(Boolean, default=False)

    # Coche entraînement
    workout_done = Column(Boolean, default=False)

    # Taux % calculé automatiquement
    compliance_rate = Column(Float, default=0.0)

    # Index utilisé très souvent → accélère les requêtes
    __table_args__ = (
        Index("idx_tracking_client_day", "client_id", "day"),
    )

    # -----------------------------------------------------------
    # 🔵 Calcul du taux d’adhérence : sécurisé contre les NULL
    # -----------------------------------------------------------
    def calculate_compliance(self):
        """
        Calcule le pourcentage d'adhérence basé sur :
            - repas matin
            - repas midi
            - repas soir
            - entraînement
        Convertit toutes les valeurs avec bool() pour éviter
        les erreurs si une valeur est NULL dans la base.
        """

        total = 4  # 3 repas + 1 entraînement

        done = sum([
            bool(self.meal_morning_done),
            bool(self.meal_noon_done),
            bool(self.meal_evening_done),
            bool(self.workout_done),
        ])

        self.compliance_rate = round((done / total) * 100, 2)
        return self.compliance_rate



# ===============================================================
# 🟨 Modèle : Suivi des séries d'exercices (poids)
# ===============================================================
class ExerciseSetTracking(Base):
    __tablename__ = "exercise_set_tracking"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True, nullable=False)

    # Exemple : "Lundi"
    day = Column(String, nullable=False)

    # Date réelle (permet analyses sur la progression)
    date = Column(Date, default=date.today, nullable=False)

    # Exemple : "Développé couché"
    exercise_name = Column(String, nullable=False)

    # Série 1, 2, 3...
    set_index = Column(Integer, nullable=False)

    # Poids soulevé (None si pas rempli)
    weight = Column(Float, nullable=True)

    # 🔐 Empêche la duplication d'une série pour un exercice
    # pour un même jour + même date + même client
    __table_args__ = (
        UniqueConstraint(
            "client_id", "day", "date", "exercise_name", "set_index",
            name="uq_client_day_date_exercise_set",
        ),
    )
