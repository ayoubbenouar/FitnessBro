from fastapi import APIRouter, Depends, HTTPException
from ..security import get_current_user
from ..schemas import CheckoutSessionRequest
from ..services.stripe_logic import create_checkout_session

router = APIRouter(prefix="/payment/checkout", tags=["Payment - Checkout"])


@router.post("/create-session")
def create_session(data: CheckoutSessionRequest, user=Depends(get_current_user)):
    if user["role"] != "coach":
        raise HTTPException(status_code=403, detail="Seuls les coachs peuvent s'abonner")

    # Retourne l'URL Stripe Checkout
    session_url = create_checkout_session(
        coach_id=user["id"],
        plan_name=data.plan_name,
        extra_packs=data.extra_packs,
    )
    return {"checkout_url": session_url}
