# app/db.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Chargement des variables d'environnement (.env)
load_dotenv()

# URL de connexion à PostgreSQL 
DATABASE_URL = os.getenv("DATABASE_URL")

# Moteur SQLAlchemy
engine = create_engine(DATABASE_URL)

# Fabrique de sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles ORM
Base = declarative_base()


def get_db():
    """
    Fournit une session de base de données pour chaque requête FastAPI.
    Gère l'ouverture/fermeture automatiquement.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
