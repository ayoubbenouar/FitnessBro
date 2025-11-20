from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, MetaData, Table
from sqlalchemy.orm import Session
from datetime import date

from .db import Base, engine, get_db
from . import models, schemas
from .security import verify_token


 
# Lecture table "users" (auth-service)
 
metadata = MetaData()

User = Table(
    "users",
    metadata,
    autoload_with=engine,
)


 
# Initialisation FastAPI
 
app = FastAPI(title="FitnessBro Tracking Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


 
# FONCTION utilitaire
 
def calculate_compliance(t: models.DailyTracking):
    t.calculate_compliance()


 
# Health
 
@app.get("/tracking/health")
def health():
    return {"status": "ok"}


 
# Client – semaine complète
 
@app.get("/tracking/me/week", response_model=list[schemas.TrackingOut])
def get_week_tracking(db: Session = Depends(get_db), user=Depends(verify_token)):
    return (
        db.query(models.DailyTracking)
        .filter_by(client_id=user["user_id"])
        .order_by(models.DailyTracking.id)
        .all()
    )


 
# Mise à jour d’un jour (toggle)
 
@app.patch("/tracking/me/update", response_model=schemas.TrackingOut)
def update_day_tracking(payload: dict, db: Session = Depends(get_db), user=Depends(verify_token)):
    uid = user["user_id"]
    day_name = payload.get("day")

    if not day_name:
        raise HTTPException(400, "Champ 'day' requis")

    day = (
        db.query(models.DailyTracking)
        .filter_by(client_id=uid, day=day_name)
        .first()
    )

    if not day:
        day = models.DailyTracking(client_id=uid, day=day_name)
        db.add(day)

    # compatibilité ancienne version
    key_map = {
        "meal_matin_done": "meal_morning_done",
        "meal_midi_done": "meal_noon_done",
        "meal_soir_done": "meal_evening_done",
    }

    for key, value in payload.items():
        real = key_map.get(key, key)
        if hasattr(day, real):
            setattr(day, real, value)

    calculate_compliance(day)

    db.commit()
    db.refresh(day)
    return day


 
# Stats client
 
@app.get("/tracking/me/stats")
def get_stats(db: Session = Depends(get_db), user=Depends(verify_token)):
    uid = user["user_id"]

    records = (
        db.query(models.DailyTracking)
        .filter_by(client_id=uid)
        .all()
    )

    if not records:
        return {"client_id": uid, "average_compliance": 0}

    avg = sum(r.compliance_rate for r in records) / len(records)
    return {"client_id": uid, "average_compliance": round(avg, 2)}


 
# Coach – Stats globales
 
@app.get("/tracking/coach/{coach_id}/clients-stats")
def get_clients_compliance_for_coach(coach_id: int, db: Session = Depends(get_db)):
    rows = db.execute(
        select(User.c.id, User.c.email).where(User.c.coach_id == coach_id)
    ).all()

    results = []
    for r in rows:
        client_id = r.id
        avg = (
            db.query(func.avg(models.DailyTracking.compliance_rate))
            .filter_by(client_id=client_id)
            .scalar()
            or 0
        )
        results.append({
            "client_id": client_id,
            "email": r.email,
            "average_compliance": round(avg, 2),
        })

    return results


 
# Coach – Vue semaine d’un client
 
@app.get("/tracking/client/{client_id}/week", response_model=list[schemas.TrackingOut])
def get_tracking_for_client(client_id: int, db: Session = Depends(get_db), user=Depends(verify_token)):
    return db.query(models.DailyTracking).filter_by(client_id=client_id).all()


 
# Coach – Stats client
 
@app.get("/tracking/client/{client_id}/stats")
def get_stats_for_client(client_id: int, db: Session = Depends(get_db), user=Depends(verify_token)):
    records = db.query(models.DailyTracking).filter_by(client_id=client_id).all()

    if not records:
        return {"client_id": client_id, "average_compliance": 0}

    avg = sum(r.compliance_rate for r in records) / len(records)
    return {"client_id": client_id, "average_compliance": round(avg, 2)}


 
# Suivi des EXERCICES (sets)
 
@app.post("/tracking/me/exercises", response_model=schemas.ExerciseSetOut)
def upsert_exercise_set(
    payload: schemas.ExerciseSetBase,
    db: Session = Depends(get_db),
    user=Depends(verify_token)
):
    uid = user["user_id"]
    data = payload.dict()

    if not data.get("date"):
        data["date"] = date.today()

    row = (
        db.query(models.ExerciseSetTracking)
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
        row = models.ExerciseSetTracking(client_id=uid, **data)
        db.add(row)

    db.commit()
    db.refresh(row)
    return row


@app.get("/tracking/me/exercises", response_model=list[schemas.ExerciseSetOut])
def get_my_exercises(db: Session = Depends(get_db), user=Depends(verify_token)):
    uid = user["user_id"]
    return (
        db.query(models.ExerciseSetTracking)
        .filter_by(client_id=uid)
        .order_by(
            models.ExerciseSetTracking.date,
            models.ExerciseSetTracking.exercise_name,
            models.ExerciseSetTracking.set_index,
        )
        .all()
    )


@app.get("/tracking/client/{client_id}/exercises", response_model=list[schemas.ExerciseSetOut])
def get_client_exercises(client_id: int, db: Session = Depends(get_db), user=Depends(verify_token)):
    return (
        db.query(models.ExerciseSetTracking)
        .filter_by(client_id=client_id)
        .order_by(
            models.ExerciseSetTracking.date,
            models.ExerciseSetTracking.exercise_name,
            models.ExerciseSetTracking.set_index,
        )
        .all()
    )
