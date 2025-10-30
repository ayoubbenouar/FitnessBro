from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Connexion à une base SQLite locale
engine = create_engine("sqlite:///./auth.db", connect_args={"check_same_thread": False})

# Session de base pour les requêtes
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# Base des modèles SQLAlchemy
class Base(DeclarativeBase):
    pass

# Fonction utilitaire pour obtenir une session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
