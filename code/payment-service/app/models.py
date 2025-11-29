from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.sql import func
from datetime import datetime
from .db import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    coach_id: Mapped[int] = mapped_column(index=True)

    plan_name: Mapped[str] = mapped_column(String(50))  # BASIC / STANDARD / PREMIUM
    base_client_limit: Mapped[int] = mapped_column(Integer)
    extra_packs: Mapped[int] = mapped_column(Integer, default=0)
    total_client_limit: Mapped[int] = mapped_column(Integer)

    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status: Mapped[str] = mapped_column(String(50), default="inactive")

    current_period_start: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )
