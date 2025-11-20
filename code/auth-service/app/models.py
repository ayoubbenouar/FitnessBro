# app/models.py
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base

class User(Base):
    __tablename__ = "users"

    # Identifiant unique
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Adresse email unique
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    # Mot de passe hashé (bcrypt)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Rôle : "coach" ou "client"
    role: Mapped[str] = mapped_column(String(50), default="client", nullable=False)

    # Si le user est un client → relié à un coach
    coach_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    # Relation auto-référencée (coach possède plusieurs clients)
    coach = relationship("User", remote_side=[id], backref="clients")
