from datetime import datetime, timezone, timedelta
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


def _convert_ts(timestamp: int | None):
    """Convertit un timestamp Stripe en datetime UTC, sinon None."""
    if not timestamp:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)


def _fallback_end_if_missing(start_dt, end_dt):
    """
    Stripe n'envoie parfois pas current_period_end lors du premier paiement.
    → On utilise start + 30 jours comme fallback.
    """
    if end_dt is not None:
        return end_dt

    if start_dt is None:
        return None

    print("⚠️ Fallback appliqué : end = start + 30 jours")
    return start_dt + timedelta(days=30)


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
    Créé ou met à jour un abonnement (checkout ou subscription.created).
    Intègre fallback si Stripe ne fournit pas la date de fin.
    """
    base_limit, total_limit = compute_limits(plan_name, extra_packs)

    start_dt = _convert_ts(current_period_start_ts)
    end_dt = _convert_ts(current_period_end_ts)

    # Fallback si Stripe n'envoie pas end
    end_dt = _fallback_end_if_missing(start_dt, end_dt)

    sub = (
        db.query(Subscription)
        .filter(Subscription.coach_id == coach_id)
        .first()
    )

    if not sub:
        # Création
        sub = Subscription(
            coach_id=coach_id,
            plan_name=plan_name.upper(),
            base_client_limit=base_limit,
            extra_packs=extra_packs,
            total_client_limit=total_limit,
            stripe_customer_id=stripe_customer_id,
            stripe_subscription_id=stripe_subscription_id,
            status="active",
            current_period_start=start_dt,
            current_period_end=end_dt,
        )
        db.add(sub)
    else:
        # Mise à jour
        sub.plan_name = plan_name.upper()
        sub.base_client_limit = base_limit
        sub.extra_packs = extra_packs
        sub.total_client_limit = total_limit
        sub.stripe_customer_id = stripe_customer_id
        sub.stripe_subscription_id = stripe_subscription_id
        sub.status = "active"

        if start_dt is not None:
            sub.current_period_start = start_dt
        if end_dt is not None:
            sub.current_period_end = end_dt

    db.commit()
    db.refresh(sub)
    return sub


def update_subscription_status_from_stripe(
    db: Session,
    stripe_subscription_id: str,
    status: str,
    current_period_start_ts: int | None,
    current_period_end_ts: int | None,
):
    """
    Mise à jour du statut et des dates.
    Fallback si end n'est pas fourni.
    """
    sub = (
        db.query(Subscription)
        .filter(Subscription.stripe_subscription_id == stripe_subscription_id)
        .first()
    )

    if not sub:
        return None

    start_dt = _convert_ts(current_period_start_ts)
    end_dt = _convert_ts(current_period_end_ts)

    end_dt = _fallback_end_if_missing(start_dt, end_dt)

    sub.status = status

    if start_dt is not None:
        sub.current_period_start = start_dt
    if end_dt is not None:
        sub.current_period_end = end_dt

    db.commit()
    db.refresh(sub)
    return sub
