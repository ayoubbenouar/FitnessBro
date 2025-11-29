# app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from . import models, schemas
from .security import verify_token
from .utils import update_profile_metrics

from datetime import date


# ============================
# 🚀 Initialisation FastAPI
# ============================

app = FastAPI(title="FitnessBro Profile Service - Profil Client & Poids")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


# ============================
# 🩺 Health Check
# ============================

@app.get("/profile/health")
def health():
    return {"status": "ok", "service": "profile-service"}


# ============================
# 👤 PROFIL : routes client
# ============================

@app.get("/profile/me", response_model=schemas.ProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    client_id = user["user_id"]
    profile = db.query(models.Profile).filter_by(client_id=client_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil non trouvé pour cet utilisateur.",
        )
    return profile


@app.put("/profile/me", response_model=schemas.ProfileOut)
def upsert_my_profile(
    payload: schemas.ProfileCreate,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    client_id = user["user_id"]

    profile = db.query(models.Profile).filter_by(client_id=client_id).first()

    if not profile:
        profile = models.Profile(client_id=client_id)
        db.add(profile)

    data = payload.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(profile, field, value)

    update_profile_metrics(profile)

    db.commit()
    db.refresh(profile)
    return profile


@app.patch("/profile/me", response_model=schemas.ProfileOut)
def patch_my_profile(
    payload: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    client_id = user["user_id"]
    profile = db.query(models.Profile).filter_by(client_id=client_id).first()

    if not profile:
        raise HTTPException(404, "Profil inexistant, utilise PUT d'abord.")

    data = payload.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(profile, field, value)

    update_profile_metrics(profile)

    db.commit()
    db.refresh(profile)
    return profile


@app.delete("/profile/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_profile(
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    client_id = user["user_id"]
    profile = db.query(models.Profile).filter_by(client_id=client_id).first()

    if not profile:
        raise HTTPException(404, "Profil déjà inexistant.")

    db.delete(profile)
    db.commit()
    return None


# ============================
# 👨‍🏫 PROFIL : vue coach
# ============================

@app.get("/profile/{client_id}", response_model=schemas.ProfileOut)
def get_profile_by_client(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    requester_id = user["user_id"]
    role = user["role"]

    if requester_id != client_id and role != "coach":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit à ce profil.",
        )

    profile = db.query(models.Profile).filter_by(client_id=client_id).first()
    if not profile:
        raise HTTPException(404, "Profil non trouvé.")
    return profile


# ============================
# 🟦 ENDPOINT INTERNE POUR CHATBOT
# ============================

@app.get("/internal/profile/{client_id}", response_model=schemas.ProfileOut)
def internal_get_profile(
    client_id: int,
    db: Session = Depends(get_db),
):
    """
    🔥 Endpoint interne utilisé uniquement par le chatbot-service.
    Pas de token demandé → communication inter-services.
    """
    profile = db.query(models.Profile).filter_by(client_id=client_id).first()

    if not profile:
        raise HTTPException(404, "Profil non trouvé.")

    return profile


# ============================
# ⚖️ WEIGHT HISTORY : client
# ============================

@app.get("/profile/me/weights", response_model=list[schemas.WeightEntryOut])
def get_my_weights(
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    client_id = user["user_id"]
    rows = (
        db.query(models.WeightHistory)
        .filter_by(client_id=client_id)
        .order_by(models.WeightHistory.date.asc())
        .all()
    )
    return rows


@app.post("/profile/me/weights", response_model=schemas.WeightEntryOut)
def add_my_weight(
    payload: schemas.WeightEntryCreate,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    client_id = user["user_id"]
    data = payload.dict()

    wt = models.WeightHistory(
        client_id=client_id,
        weight_kg=data["weight_kg"],
        date=data["date"] or date.today(),
    )
    db.add(wt)

    profile = db.query(models.Profile).filter_by(client_id=client_id).first()
    if profile:
        profile.weight_kg = wt.weight_kg
        update_profile_metrics(profile)

    db.commit()
    db.refresh(wt)
    return wt


@app.delete("/profile/me/weights/{weight_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_weight(
    weight_id: int,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    client_id = user["user_id"]
    row = (
        db.query(models.WeightHistory)
        .filter_by(id=weight_id, client_id=client_id)
        .first()
    )

    if not row:
        raise HTTPException(404, "Entrée de poids non trouvée.")

    db.delete(row)
    db.commit()
    return None


# ============================
# ⚖️ WEIGHT HISTORY : vue coach
# ============================

@app.get("/profile/{client_id}/weights", response_model=list[schemas.WeightEntryOut])
def get_weights_for_client(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    requester_id = user["user_id"]
    role = user["role"]

    if requester_id != client_id and role != "coach":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit à cet historique.",
        )

    rows = (
        db.query(models.WeightHistory)
        .filter_by(client_id=client_id)
        .order_by(models.WeightHistory.date.asc())
        .all()
    )
    return rows
