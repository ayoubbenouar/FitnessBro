# app/db.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Chargement des variables d'environnement (.env)
load_dotenv()

# URL de connexion à PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")

# Création du moteur SQLAlchemy
engine = create_engine(DATABASE_URL)

# Session locale injectée dans FastAPI
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base des modèles ORM
Base = declarative_base()

def get_db():
    """
    Fournit une session DB pour chaque requête.
    Gère automatiquement l'ouverture/fermeture.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
