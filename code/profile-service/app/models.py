# app/models.py
from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Text,
    Date,
    DateTime,
    Index,
)
from sqlalchemy.sql import func
from .db import Base


class Profile(Base):
    """
    Profil complet d'un client :
    - données physiques
    - objectifs
    - allergies / conditions médicales
    - préférences alimentaires
    - métabolisme (BMR, TDEE)
    """

    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    # 🔗 Id du user dans auth-service
    client_id = Column(Integer, unique=True, index=True, nullable=False)

    # Données physiques
    age = Column(Integer, nullable=True)             # années
    sex = Column(String(10), nullable=True)          # "male" / "female"
    weight_kg = Column(Float, nullable=True)         # poids actuel en kg
    height_cm = Column(Float, nullable=True)         # taille en cm
    target_weight_kg = Column(Float, nullable=True)  # objectif poids en kg

    # Objectifs & niveau
    goal = Column(String(50), nullable=True)             # perte_poids / prise_masse / maintien...
    activity_level = Column(String(50), nullable=True)   # sedentary / light / moderate / high / athlete
    experience_level = Column(String(50), nullable=True) # beginner / intermediate / advanced

    # Allergies & santé
    allergies = Column(Text, nullable=True)          # ex: "lactose,noix,gluten"
    medical_conditions = Column(Text, nullable=True) # ex: "hypertension, diabète type II"
    food_preferences = Column(Text, nullable=True)   # ex: "vegan, halal, sans porc"

    # Métabolisme
    bmr = Column(Float, nullable=True)   # Basal Metabolic Rate
    tdee = Column(Float, nullable=True)  # Total Daily Energy Expenditure

    # Meta
    note = Column(Text, nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class WeightHistory(Base):
    """
    Historique des poids du client.
    Permet d’afficher graphiques, progression, tendances.
    """

    __tablename__ = "weight_history"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True, nullable=False)

    weight_kg = Column(Float, nullable=False)
    date = Column(Date, nullable=False, server_default=func.current_date())

    # tri plus rapide par (client, date)
    __table_args__ = (
        Index("idx_weight_client_date", "client_id", "date"),
    )
