from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..security import get_current_user
from ..db import get_db
from ..models import Subscription
from ..schemas import SubscriptionOut, SubscriptionLimitResponse

router = APIRouter(prefix="/payment/subscription", tags=["Payment - Subscription"])


@router.get("/me", response_model=SubscriptionOut)
def get_my_subscription(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = (
        db.query(Subscription)
        .filter(Subscription.coach_id == user["id"])
        .first()
    )
    if not sub:
        return SubscriptionOut(
            plan_name=None,
            status="inactive",
            base_client_limit=0,
            extra_packs=0,
            total_client_limit=0,
        )
    return sub


@router.get("/{coach_id}/limit", response_model=SubscriptionLimitResponse)
def get_limit(
    coach_id: int,
    current_clients: int,
    db: Session = Depends(get_db),
):
    """
    Endpoint interne pour auth-service ou un future client-service.
    current_clients est envoyé par le service appelant.
    """
    sub = (
        db.query(Subscription)
        .filter(Subscription.coach_id == coach_id)
        .first()
    )

    if not sub or sub.status != "active":
        return SubscriptionLimitResponse(
            max_clients=0,
            current_clients=current_clients,
            can_add=False,
        )

    can_add = current_clients < sub.total_client_limit

    return SubscriptionLimitResponse(
        max_clients=sub.total_client_limit,
        current_clients=current_clients,
        can_add=can_add,
    )
