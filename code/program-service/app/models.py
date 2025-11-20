# app/models.py
from sqlalchemy import Column, Integer, String, Float, Text
from sqlalchemy.dialects.postgresql import JSONB
from .db import Base


class Program(Base):
    """
    Modèle de programme d'entraînement/nutrition.
    Stocké en base dans la table "programs".
    """
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)

    # Coach qui a créé le programme
    coach_id = Column(Integer, nullable=False, index=True)

    # Client à qui le programme est destiné
    client_id = Column(Integer, nullable=False, index=True)

    # Titre du programme (ex: "Sèche 6 semaines")
    title = Column(String, nullable=False)

    # Notes libres du coach
    notes = Column(Text, nullable=True)

    # JSONB pour stocker les jours :
    # - repas détaillés (foods, calories)
    # - exercices (name, sets, reps, vidéo, etc.)
    days = Column(JSONB, nullable=False)

    # Total calories pour l'ensemble de la semaine
    calories = Column(Float, default=0.0)
