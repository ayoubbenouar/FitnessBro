from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="client", nullable=False)
    coach_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    # ✅ Relation : un coach peut avoir plusieurs clients
    coach = relationship("User", remote_side=[id], backref="clients")
