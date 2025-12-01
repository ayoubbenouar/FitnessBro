from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
import stripe

from ..config import settings
from ..db import get_db
from ..models import Subscription
from ..services.subscription_logic import (
    upsert_subscription_from_checkout,
    update_subscription_status_from_stripe,
)

router = APIRouter(prefix="/payment/webhook", tags=["Payment - Webhook"])

stripe.api_key = settings.STRIPE_SECRET_KEY


@router.post("/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    # Vérification de signature du webhook
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        print("❌ Webhook signature error:", e)
        raise HTTPException(status_code=400, detail="Webhook invalide")

    event_type = event["type"]
    print(f"➡️ EVENT REÇU : {event_type}")

    # =============================================================
    # 1️⃣ checkout.session.completed → création initiale (SANS dates)
    #    On NE touche pas aux dates si la sub existe déjà.
    # =============================================================
    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata") or {}

        coach_id = metadata.get("coach_id")
        plan_name = metadata.get("plan_name")
        extra_packs = int(metadata.get("extra_packs", "0"))

        if not coach_id or not plan_name:
            print("⚠️ Metadata manquante dans checkout.session.completed")
            return {"status": "ignored"}

        coach_id = int(coach_id)

        # Si une subscription existe déjà pour ce coach, on ne recrée pas
        existing = (
            db.query(Subscription)
            .filter(Subscription.coach_id == coach_id)
            .first()
        )
        if existing and existing.stripe_subscription_id:
            print("⚠️ Subscription déjà existante → checkout ignoré")
            return {"status": "ignored"}

        stripe_customer_id = session["customer"]
        stripe_subscription_id = session["subscription"]

        print(f"🟦 Création abonnement pour coach {coach_id} (sans dates)")

        # Pas de dates ici ⇒ current_period_* = None
        upsert_subscription_from_checkout(
            db=db,
            coach_id=coach_id,
            plan_name=plan_name,
            extra_packs=extra_packs,
            stripe_customer_id=stripe_customer_id,
            stripe_subscription_id=stripe_subscription_id,
            current_period_start_ts=None,
            current_period_end_ts=None,
        )

    # =============================================================
    # 2️⃣ invoice.payment_succeeded → contient la période (via sub)
    #    Ici on récupère la subscription Stripe complète.
    # =============================================================
    elif event_type == "invoice.payment_succeeded":
        invoice = event["data"]["object"]
        stripe_subscription_id = invoice.get("subscription")

        if not stripe_subscription_id:
            print("⚠️ Pas de subscription dans invoice.payment_succeeded")
            return {"status": "ignored"}

        sub_stripe = stripe.Subscription.retrieve(stripe_subscription_id)

        # ⚠️ Stripe peut ne pas envoyer current_period_start,
        # mais billing_cycle_anchor est toujours présent.
        current_period_start = (
            sub_stripe.get("current_period_start")
            or sub_stripe.get("billing_cycle_anchor")
        )
        current_period_end = sub_stripe.get("current_period_end")
        status = sub_stripe.get("status")

        print(
            f"🟩 Mise à jour dates pour subscription {stripe_subscription_id} "
            f"(start={current_period_start}, end={current_period_end})"
        )

        update_subscription_status_from_stripe(
            db=db,
            stripe_subscription_id=stripe_subscription_id,
            status=status,
            current_period_start_ts=current_period_start,
            current_period_end_ts=current_period_end,
        )

    # =============================================================
    # 3️⃣ invoice.payment_failed → paiement échoué
    # =============================================================
    elif event_type == "invoice.payment_failed":
        invoice = event["data"]["object"]
        stripe_subscription_id = invoice.get("subscription")

        if not stripe_subscription_id:
            print("⚠️ Pas de subscription dans invoice.payment_failed")
            return {"status": "ignored"}

        sub_stripe = stripe.Subscription.retrieve(stripe_subscription_id)
        status = sub_stripe.get("status")

        print(f"❌ Paiement échoué pour {stripe_subscription_id}")

        # On ne change pas les dates ici (None)
        update_subscription_status_from_stripe(
            db=db,
            stripe_subscription_id=stripe_subscription_id,
            status=status,
            current_period_start_ts=None,
            current_period_end_ts=None,
        )

    # =============================================================
    # 4️⃣ customer.subscription.deleted → abonnement annulé
    # =============================================================
    elif event_type == "customer.subscription.deleted":
        sub_obj = event["data"]["object"]

        stripe_subscription_id = sub_obj["id"]
        status = sub_obj.get("status")

        current_period_start = (
            sub_obj.get("current_period_start")
            or sub_obj.get("billing_cycle_anchor")
        )
        current_period_end = sub_obj.get("current_period_end")

        print(f"❌ Subscription annulée {stripe_subscription_id}")

        update_subscription_status_from_stripe(
            db=db,
            stripe_subscription_id=stripe_subscription_id,
            status=status,
            current_period_start_ts=current_period_start,
            current_period_end_ts=current_period_end,
        )

    # =============================================================
    # 5️⃣ customer.subscription.created  → création avec dates
    # =============================================================
    elif event_type == "customer.subscription.created":
        sub_obj = event["data"]["object"]

        stripe_subscription_id = sub_obj["id"]
        stripe_customer_id = sub_obj["customer"]

        # ✅ On utilise PRICE (plan est déprécié + nickname peut être null)
        items = sub_obj.get("items", {}).get("data", [])
        price_id = None
        if items:
            price = items[0].get("price") or {}
            price_id = price.get("id")

        # Mapping price_id → nom de plan interne
        if price_id == settings.STRIPE_PRICE_BASIC:
            plan_name = "BASIC"
        elif price_id == settings.STRIPE_PRICE_STANDARD:
            plan_name = "STANDARD"
        elif price_id == settings.STRIPE_PRICE_PREMIUM:
            plan_name = "PREMIUM"
        else:
            plan_name = "UNKNOWN"

        # ⚠️ Fallback sur billing_cycle_anchor si current_period_start absent
        current_period_start = (
            sub_obj.get("current_period_start")
            or sub_obj.get("billing_cycle_anchor")
        )
        current_period_end = sub_obj.get("current_period_end")

        metadata = sub_obj.get("metadata") or {}
        coach_id = metadata.get("coach_id")
        extra_packs = metadata.get("extra_packs", "0")

        if not coach_id:
            print(
                "⚠️ Pas de coach_id dans metadata de subscription.created → on ignore"
            )
            return {"status": "ignored"}

        coach_id = int(coach_id)
        extra_packs = int(extra_packs)

        print(
            f"🟩 Création abonnement (v2) avec dates pour coach {coach_id} "
            f"(start={current_period_start}, end={current_period_end})"
        )

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

    # =============================================================
    # 6️⃣ customer.subscription.updated → renouvellement / upgrade
    # =============================================================
    elif event_type == "customer.subscription.updated":
        sub_obj = event["data"]["object"]

        stripe_subscription_id = sub_obj["id"]
        status = sub_obj.get("status")

        current_period_start = (
            sub_obj.get("current_period_start")
            or sub_obj.get("billing_cycle_anchor")
        )
        current_period_end = sub_obj.get("current_period_end")

        print(
            "🔄 Mise à jour période abonnement (customer.subscription.updated) "
            f"(start={current_period_start}, end={current_period_end})"
        )

        update_subscription_status_from_stripe(
            db=db,
            stripe_subscription_id=stripe_subscription_id,
            status=status,
            current_period_start_ts=current_period_start,
            current_period_end_ts=current_period_end,
        )

    return {"status": "ok"}
