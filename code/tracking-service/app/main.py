# app/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import (
    func,
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    UniqueConstraint,
    Date,
)
from datetime import date

from .db import Base, engine, get_db
from . import models, schemas
from .security import verify_token

# =======================================================
# 🧩 Modèle User minimal pour lire la table du auth-service
# (IMPORTANT : pas de création, juste la lecture)
# =======================================================
class User(Base):
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255))
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=True)


# =======================================================
# 🏋️ Modèle : tracking des séries d'exercices
# =======================================================
class ExerciseSetTracking(Base):
    __tablename__ = "exercise_set_tracking"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, index=True, nullable=False)
    day = Column(String, nullable=False)                   # "Lundi"
    date = Column(Date, nullable=False, default=date.today)  # 🔥 date réelle
    exercise_name = Column(String, nullable=False)         # "Développé couché"
    set_index = Column(Integer, nullable=False)            # Série 1,2,3,4...
    weight = Column(Float, nullable=True)                  # poids soulevé

    __table_args__ = (
        UniqueConstraint(
            "client_id",
            "day",
            "date",
            "exercise_name",
            "set_index",
            name="uq_client_day_date_exercise_set",
        ),
    )


# =======================================================
# 🚀 Initialisation FastAPI
# =======================================================
app = FastAPI(title="FitnessBro Tracking Service - Suivi Client")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


# =======================================================
# 🔧 Calcul du taux de conformité
# =======================================================
def calculate_compliance(t: models.DailyTracking):
    total = 4
    done = sum(
        [
            bool(t.meal_morning_done),
            bool(t.meal_noon_done),
            bool(t.meal_evening_done),
            bool(t.workout_done),
        ]
    )
    t.compliance_rate = round((done / total) * 100, 2)


# =======================================================
# 🩺 Health Check
# =======================================================
@app.get("/tracking/health")
def health():
    return {"status": "ok", "service": "tracking-service"}


# =======================================================
# 👤 Routes protégées — Tracking repas / entraînement
# =======================================================
@app.get("/tracking/me/week", response_model=list[schemas.TrackingOut])
def get_week_tracking(
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    uid = user["user_id"]
    return (
        db.query(models.DailyTracking)
        .filter(models.DailyTracking.client_id == uid)
        .all()
    )


@app.patch("/tracking/me/update", response_model=schemas.TrackingOut)
def update_day_tracking(
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    uid = user["user_id"]
    day_name = payload.get("day")

    if not day_name:
        raise HTTPException(400, "Le champ 'day' est requis")

    # Récupération ou création du tracking du jour
    day = (
        db.query(models.DailyTracking)
        .filter(
            models.DailyTracking.client_id == uid,
            models.DailyTracking.day == day_name,
        )
        .first()
    )

    if not day:
        day = models.DailyTracking(client_id=uid, day=day_name)
        db.add(day)

    # Tolérance pour anciens champs
    key_map = {
        "meal_matin_done": "meal_morning_done",
        "meal_midi_done": "meal_noon_done",
        "meal_soir_done": "meal_evening_done",
    }

    for key, value in payload.items():
        mapped = key_map.get(key, key)
        if hasattr(day, mapped):
            setattr(day, mapped, value)

    # recalcul conformité
    calculate_compliance(day)

    db.commit()
    db.refresh(day)
    return day


@app.get("/tracking/me/stats")
def get_stats(
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    uid = user["user_id"]
    records = (
        db.query(models.DailyTracking)
        .filter(models.DailyTracking.client_id == uid)
        .all()
    )
    if not records:
        raise HTTPException(404, "Aucun suivi trouvé")

    avg = sum([r.compliance_rate for r in records]) / len(records)
    return {"client_id": uid, "average_compliance": round(avg, 2)}


# =======================================================
# 🧑‍🏫 Routes coach — consulter le suivi client
# =======================================================
@app.get("/tracking/coach/{coach_id}/clients-stats")
def get_clients_compliance_for_coach(
    coach_id: int,
    db: Session = Depends(get_db),
):

    clients = db.query(User).filter(User.coach_id == coach_id).all()
    results = []

    for c in clients:
        avg = (
            db.query(func.avg(models.DailyTracking.compliance_rate))
            .filter(models.DailyTracking.client_id == c.id)
            .scalar()
            or 0
        )
        results.append(
            {
                "client_id": c.id,
                "email": c.email,
                "average_compliance": round(avg, 2),
            }
        )

    return results


@app.get(
    "/tracking/client/{client_id}/week",
    response_model=list[schemas.TrackingOut],
)
def get_tracking_for_client(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    return (
        db.query(models.DailyTracking)
        .filter(models.DailyTracking.client_id == client_id)
        .all()
    )


@app.get("/tracking/client/{client_id}/stats")
def get_stats_for_client(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    records = (
        db.query(models.DailyTracking)
        .filter(models.DailyTracking.client_id == client_id)
        .all()
    )
    if not records:
        return {"client_id": client_id, "average_compliance": 0}

    avg = sum([r.compliance_rate for r in records]) / len(records)
    return {"client_id": client_id, "average_compliance": round(avg, 2)}


# =======================================================
# 🏋️ Tracking exercices (poids / séries)
# =======================================================

# ---- 1. Créer / mettre à jour une série (UPSERT)
@app.post("/tracking/me/exercises", response_model=schemas.ExerciseSetOut)
def upsert_exercise_set(
    payload: schemas.ExerciseSetBase,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    uid = user["user_id"]

    data = payload.dict()
    # Si la date n'est pas fournie côté frontend, on met la date du jour
    if not data.get("date"):
        data["date"] = date.today()

    # Recherche d'une série existante pour ce client / jour / date / exo / série
    row = (
        db.query(ExerciseSetTracking)
        .filter_by(
            client_id=uid,
            day=data["day"],
            date=data["date"],
            exercise_name=data["exercise_name"],
            set_index=data["set_index"],
        )
        .first()
    )

    if row:
        row.weight = data.get("weight")
    else:
        row = ExerciseSetTracking(client_id=uid, **data)
        db.add(row)

    db.commit()
    db.refresh(row)
    return row


# ---- 2. Exos du client connecté
@app.get(
    "/tracking/me/exercises",
    response_model=list[schemas.ExerciseSetOut],
)
def get_my_exercises(
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    uid = user["user_id"]
    return (
        db.query(ExerciseSetTracking)
        .filter(ExerciseSetTracking.client_id == uid)
        .order_by(ExerciseSetTracking.date, ExerciseSetTracking.exercise_name, ExerciseSetTracking.set_index)
        .all()
    )


# ---- 3. Exos d'un client (coach)
@app.get(
    "/tracking/client/{client_id}/exercises",
    response_model=list[schemas.ExerciseSetOut],
)
def get_client_exercises(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    return (
        db.query(ExerciseSetTracking)
        .filter(ExerciseSetTracking.client_id == client_id)
        .order_by(ExerciseSetTracking.date, ExerciseSetTracking.exercise_name, ExerciseSetTracking.set_index)
        .all()
    )
