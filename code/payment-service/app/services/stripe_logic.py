import stripe
from ..config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

# Correspondance des plans → prix Stripe
PLAN_PRICE_MAP = {
    "BASIC": settings.STRIPE_PRICE_BASIC,
    "STANDARD": settings.STRIPE_PRICE_STANDARD,
    "PREMIUM": settings.STRIPE_PRICE_PREMIUM,
}


def create_checkout_session(coach_id: int, plan_name: str, extra_packs: int) -> str:
    """
    Crée une session Stripe Checkout pour un abonnement mensuel.
    - plan_name: BASIC / STANDARD / PREMIUM
    - extra_packs: nombre de packs supplémentaires (Premium uniquement)
    """

    plan_name = plan_name.upper()

    if plan_name not in PLAN_PRICE_MAP:
        raise ValueError("Plan d’abonnement inconnu.")

    # Article principal
    line_items = [
        {
            "price": PLAN_PRICE_MAP[plan_name],
            "quantity": 1,
        }
    ]

    # Extras uniquement pour PREMIUM
    if plan_name == "PREMIUM" and extra_packs > 0:
        if not settings.STRIPE_PRICE_EXTRA:
            raise ValueError("Aucun prix EXTRA configuré dans .env")

        line_items.append(
            {
                "price": settings.STRIPE_PRICE_EXTRA,
                "quantity": extra_packs,
            }
        )

    # Pages de redirection
    success_url = f"{settings.FRONTEND_URL}/payment/success"
    cancel_url = f"{settings.FRONTEND_URL}/payment/cancel"

    # ============================================
    # 🔥 CRUCIAL : metadata dans BOTH
    # - metadata = pour checkout.session.completed
    # - subscription_data.metadata = pour subscription.created
    # ============================================
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=line_items,
        success_url=success_url,
        cancel_url=cancel_url,

        # Associe la session au coach
        client_reference_id=str(coach_id),

        # 🔥 Metadata envoyées dans checkout.session.completed
        metadata={
            "coach_id": str(coach_id),
            "plan_name": plan_name,
            "extra_packs": str(extra_packs),
        },

        # 🔥 Metadata copiées directement dans la subscription
        subscription_data={
            "metadata": {
                "coach_id": str(coach_id),
                "plan_name": plan_name,
                "extra_packs": str(extra_packs),
            }
        },
    )

    return session.url
