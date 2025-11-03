# code/tracking-service/app/main.py

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .db import Base, engine, get_db
from . import models, schemas
from .security import verify_token  # ✅ on importe la bonne fonction

from fastapi.middleware.cors import CORSMiddleware

# -------------------------------------------------------
# Initialisation de l'application
# -------------------------------------------------------
app = FastAPI(title="FitnessBro Tracking Service - Suivi Client")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# -------------------------------------------------------
# Fonction utilitaire
# -------------------------------------------------------
def calculate_compliance(t: models.DailyTracking):
    total = 4
    done = sum([
        t.meal_morning_done,
        t.meal_noon_done,
        t.meal_evening_done,
        t.workout_done,
    ])
    t.compliance_rate = round((done / total) * 100, 2)

# -------------------------------------------------------
# Routes publiques
# -------------------------------------------------------
@app.get("/tracking/health")
def health():
    return {"status": "ok", "service": "tracking-service"}

# -------------------------------------------------------
# Routes protégées par JWT
# -------------------------------------------------------
@app.get("/tracking/me/week", response_model=list[schemas.TrackingOut])
def get_week_tracking(
    db: Session = Depends(get_db),
    user=Depends(verify_token),  # ✅ utilise verify_token
):
    user_id = user["user_id"]
    records = db.query(models.DailyTracking).filter(
        models.DailyTracking.client_id == user_id
    ).all()
    return records


@app.patch("/tracking/me/update", response_model=schemas.TrackingOut)
def update_day_tracking(
    payload: schemas.TrackingUpdate,
    db: Session = Depends(get_db),
    user=Depends(verify_token),  # ✅ token validé ici aussi
):
    user_id = user["user_id"]

    # Récupère ou crée le suivi du jour
    day = db.query(models.DailyTracking).filter(
        models.DailyTracking.client_id == user_id,
        models.DailyTracking.day == payload.day
    ).first()

    if not day:
        day = models.DailyTracking(client_id=user_id, day=payload.day)
        db.add(day)

    # Met à jour les champs
    day.meal_morning_done = payload.meal_morning_done
    day.meal_noon_done = payload.meal_noon_done
    day.meal_evening_done = payload.meal_evening_done
    day.workout_done = payload.workout_done

    # Calcule la conformité du jour
    calculate_compliance(day)

    db.commit()
    db.refresh(day)
    return day


@app.get("/tracking/me/stats")
def get_stats(
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    user_id = user["user_id"]

    records = db.query(models.DailyTracking).filter(
        models.DailyTracking.client_id == user_id
    ).all()

    if not records:
        raise HTTPException(status_code=404, detail="Aucun suivi trouvé")

    avg = sum([r.compliance_rate for r in records]) / len(records)
    return {"client_id": user_id, "average_compliance": round(avg, 2)}
