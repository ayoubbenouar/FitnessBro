from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CheckoutSessionRequest(BaseModel):
    plan_name: str  # BASIC / STANDARD / PREMIUM
    extra_packs: int = 0  # uniquement pour PREMIUM


class SubscriptionOut(BaseModel):
    plan_name: Optional[str]
    status: Optional[str]
    base_client_limit: int = 0
    extra_packs: int = 0
    total_client_limit: int = 0
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None

    class Config:
        orm_mode = True


class SubscriptionLimitResponse(BaseModel):
    max_clients: int
    current_clients: int
    can_add: bool
