import stripe
from .subscription_logic import compute_limits
from ..config import settings


stripe.api_key = settings.STRIPE_SECRET_KEY


PLAN_PRICE_MAP = {
    "BASIC": settings.STRIPE_PRICE_BASIC,
    "STANDARD": settings.STRIPE_PRICE_STANDARD,
    "PREMIUM": settings.STRIPE_PRICE_PREMIUM,
}


def create_checkout_session(coach_id: int, plan_name: str, extra_packs: int) -> str:
    """
    Crée une session Stripe Checkout pour un abonnement mensuel.
    - plan_name: BASIC / STANDARD / PREMIUM
    - extra_packs: nombre de packs de 5 clients (uniquement pertinent pour PREMIUM)
    """

    plan_name = plan_name.upper()
    if plan_name not in PLAN_PRICE_MAP:
        raise ValueError("Plan inconnu")

    line_items = [
        {
            "price": PLAN_PRICE_MAP[plan_name],
            "quantity": 1,
        }
    ]

    # Extras seulement pour PREMIUM
    if plan_name == "PREMIUM" and extra_packs > 0 and settings.STRIPE_PRICE_EXTRA:
        line_items.append(
            {
                "price": settings.STRIPE_PRICE_EXTRA,
                "quantity": extra_packs,
            }
        )

    # URL de redirection
    success_url = f"{settings.FRONTEND_URL}/payment/success"
    cancel_url = f"{settings.FRONTEND_URL}/payment/cancel"

    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=line_items,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "coach_id": str(coach_id),
            "plan_name": plan_name,
            "extra_packs": str(extra_packs),
        },
    )

    return session.url
