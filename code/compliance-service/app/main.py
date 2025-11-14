# app/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .db import Base, engine, get_db
from . import models, schemas
from .security import verify_token

app = FastAPI(title="FitnessBro Compliance Service - Conformité Repas & Entraînement")

# -------------------------------------------------------
# CORS
# -------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# -------------------------------------------------------
# 🔵 ROUTE : Test de santé
# -------------------------------------------------------
@app.get("/compliance/health")
def health():
    return {"status": "ok", "service": "compliance-service"}


# -------------------------------------------------------
# 🔵 ROUTE : Calcul d’une journée (avec enregistrement)
# -------------------------------------------------------
@app.post("/compliance/calculate", response_model=schemas.ComplianceResult)
def calculate_compliance(
    entry: schemas.DailyEntry,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    """
    Calcule la conformité d'une journée (repas + entraînement),
    l'enregistre dans PostgreSQL, puis retourne le taux.
    """

    total = 4
    done = sum([
        entry.meal_morning_done,
        entry.meal_noon_done,
        entry.meal_evening_done,
        entry.workout_done,
    ])
    rate = round((done / total) * 100, 2)

    record = models.ComplianceRecord(
        client_id=user["user_id"],
        daily_data=entry.dict(),
        compliance_rate=rate,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {"compliance_rate": rate}


# -------------------------------------------------------
# 🔵 ROUTE : Calcul hebdomadaire (sans sauvegarde)
# -------------------------------------------------------
@app.post("/compliance/weekly", response_model=schemas.WeeklySummary)
def calculate_weekly_average(
    payload: dict,
    user=Depends(verify_token),
):
    """
    Reçoit un tableau d'entrées de tracking, retourne :
    - taux quotidien
    - moyenne hebdomadaire
    """
    entries = payload.get("entries", [])
    client_id = payload.get("client_id", user["user_id"])

    if not entries:
        raise HTTPException(status_code=400, detail="Aucune donnée fournie")

    rates = []
    for e in entries:
        done = sum([
            e["meal_morning_done"],
            e["meal_noon_done"],
            e["meal_evening_done"],
            e["workout_done"],
        ])
        rate = round((done / 4) * 100, 2)
        rates.append(rate)

    avg = round(sum(rates) / len(rates), 2)

    return {
        "client_id": client_id,
        "average_compliance": avg,
        "daily_rates": rates,
    }
