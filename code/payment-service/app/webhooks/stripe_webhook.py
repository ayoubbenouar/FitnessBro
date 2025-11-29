from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
import stripe
from ..config import settings
from ..db import get_db
from ..services.subscription_logic import (
    upsert_subscription_from_checkout,
    update_subscription_status_from_stripe,
)

router = APIRouter(prefix="/payment/webhook", tags=["Payment - Webhook"])

stripe.api_key = settings.STRIPE_SECRET_KEY


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Webhook invalide")

    event_type = event["type"]

    # 1) Paiement initial via Checkout
    if event_type == "checkout.session.completed":
        session = event["data"]["object"]

        coach_id = int(session["metadata"]["coach_id"])
        plan_name = session["metadata"]["plan_name"]
        extra_packs = int(session["metadata"].get("extra_packs", "0"))
        stripe_customer_id = session["customer"]
        stripe_subscription_id = session["subscription"]

        # On récupère la subscription Stripe pour dates de période
        sub_stripe = stripe.Subscription.retrieve(stripe_subscription_id)
        current_period_start = sub_stripe["current_period_start"]
        current_period_end = sub_stripe["current_period_end"]

        upsert_subscription_from_checkout(
            db=db,
            coach_id=coach_id,
            plan_name=plan_name,
            extra_packs=extra_packs,
            stripe_customer_id=stripe_customer_id,
            stripe_subscription_id=stripe_subscription_id,
            current_period_start_ts=current_period_start,
            current_period_end_ts=current_period_end,
        )

    # 2) Renouvellement réussi
    elif event_type == "invoice.payment_succeeded":
        invoice = event["data"]["object"]
        stripe_subscription_id = invoice["subscription"]
        sub_stripe = stripe.Subscription.retrieve(stripe_subscription_id)
        status = sub_stripe["status"]
        current_period_end = sub_stripe["current_period_end"]

        update_subscription_status_from_stripe(
            db=db,
            stripe_subscription_id=stripe_subscription_id,
            status=status,
            current_period_end_ts=current_period_end,
        )

    # 3) Paiement échoué
    elif event_type == "invoice.payment_failed":
        invoice = event["data"]["object"]
        stripe_subscription_id = invoice["subscription"]
        sub_stripe = stripe.Subscription.retrieve(stripe_subscription_id)
        status = sub_stripe["status"]
        current_period_end = sub_stripe.get("current_period_end")

        update_subscription_status_from_stripe(
            db=db,
            stripe_subscription_id=stripe_subscription_id,
            status=status,
            current_period_end_ts=current_period_end,
        )

    # 4) Abonnement annulé
    elif event_type == "customer.subscription.deleted":
        sub_obj = event["data"]["object"]
        stripe_subscription_id = sub_obj["id"]
        status = sub_obj["status"]
        current_period_end = sub_obj.get("current_period_end")

        update_subscription_status_from_stripe(
            db=db,
            stripe_subscription_id=stripe_subscription_id,
            status=status,
            current_period_end_ts=current_period_end,
        )

    return {"status": "ok"}
