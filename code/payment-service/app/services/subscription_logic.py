from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..models import Subscription


def compute_limits(plan_name: str, extra_packs: int) -> tuple[int, int]:
    """
    Retourne (base_client_limit, total_client_limit)
    selon le plan + extras.
    """
    plan_name = plan_name.upper()

    if plan_name == "BASIC":
        base = 10
    elif plan_name == "STANDARD":
        base = 20
    elif plan_name == "PREMIUM":
        base = 50
    else:
        base = 0

    extras = max(extra_packs, 0)
    total = base + extras * 5
    return base, total


def upsert_subscription_from_checkout(
    db: Session,
    coach_id: int,
    plan_name: str,
    extra_packs: int,
    stripe_customer_id: str,
    stripe_subscription_id: str,
    current_period_start_ts: int | None,
    current_period_end_ts: int | None,
):
    """
    Créé ou met à jour un abonnement à partir d'une session Checkout Stripe.
    """
    base_limit, total_limit = compute_limits(plan_name, extra_packs)

    sub = (
        db.query(Subscription)
        .filter(Subscription.coach_id == coach_id)
        .first()
    )

    if current_period_start_ts:
        current_period_start = datetime.fromtimestamp(
            current_period_start_ts, tz=timezone.utc
        )
    else:
        current_period_start = None

    if current_period_end_ts:
        current_period_end = datetime.fromtimestamp(
            current_period_end_ts, tz=timezone.utc
        )
    else:
        current_period_end = None

    if not sub:
        sub = Subscription(
            coach_id=coach_id,
            plan_name=plan_name.upper(),
            base_client_limit=base_limit,
            extra_packs=extra_packs,
            total_client_limit=total_limit,
            stripe_customer_id=stripe_customer_id,
            stripe_subscription_id=stripe_subscription_id,
            status="active",
            current_period_start=current_period_start,
            current_period_end=current_period_end,
        )
        db.add(sub)
    else:
        sub.plan_name = plan_name.upper()
        sub.base_client_limit = base_limit
        sub.extra_packs = extra_packs
        sub.total_client_limit = total_limit
        sub.stripe_customer_id = stripe_customer_id
        sub.stripe_subscription_id = stripe_subscription_id
        sub.status = "active"
        sub.current_period_start = current_period_start
        sub.current_period_end = current_period_end

    db.commit()
    db.refresh(sub)
    return sub


def update_subscription_status_from_stripe(
    db: Session,
    stripe_subscription_id: str,
    status: str,
    current_period_end_ts: int | None,
):
    sub = (
        db.query(Subscription)
        .filter(Subscription.stripe_subscription_id == stripe_subscription_id)
        .first()
    )

    if not sub:
        return None

    sub.status = status

    if current_period_end_ts:
        from datetime import datetime, timezone

        sub.current_period_end = datetime.fromtimestamp(
            current_period_end_ts, tz=timezone.utc
        )

    db.commit()
    db.refresh(sub)
    return sub
