from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .db import Base, engine, get_db
from . import models, schemas
import re
import httpx
from jose import jwt, JWTError
from typing import Dict, Any

# ----------------------------
# Configuration JWT
# ----------------------------
JWT_SECRET = "change-me"   # même clé que dans auth-service/security.py
JWT_ALG = "HS256"
security = HTTPBearer()

# ----------------------------
# Initialisation FastAPI
# ----------------------------
app = FastAPI(title="FitnessBro Program Service - Nutrition & Training")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# ----------------------------
# Base locale des aliments
# ----------------------------
FOOD_DB = {
    "poulet": 239, "chicken": 239,
    "boeuf": 250, "beef": 250,
    "poisson": 200, "fish": 200,
    "oeuf": 155, "egg": 155,
    "riz": 130, "rice": 130,
    "pâtes": 131, "pasta": 131,
    "pain": 265, "bread": 265,
    "patates": 77, "potato": 77,
    "avocat": 160, "avocado": 160,
    "pomme": 52, "apple": 52,
    "banane": 89, "banana": 89,
    "brocoli": 34, "broccoli": 34,
    "tomate": 18, "tomato": 18,
    "lait": 42, "milk": 42,
    "fromage": 350, "cheese": 350,
    "yaourt": 60, "yogurt": 60,
    "huile": 884, "oil": 884,
}

# ----------------------------
# Routes de base
# ----------------------------
@app.get("/program/health")
def health():
    return {"status": "ok", "service": "program-service"}

# -------------------------------------------------------
# 🔹 Créer un programme
# -------------------------------------------------------
@app.post("/program", response_model=schemas.ProgramOut, status_code=201)
def create_program(payload: schemas.ProgramCreate, db: Session = Depends(get_db)):
    if not payload.days or len(payload.days) == 0:
        raise HTTPException(status_code=400, detail="Aucun jour fourni.")

    total_weekly_calories = 0.0
    days_with_details = []

    for day_data in payload.days:
        meals = day_data.meals
        workout = day_data.workout or "Repos"
        meal_details = {}
        daily_total = 0.0

        for meal_name, meal_text in meals.items():
            items = [i.strip() for i in re.split(r"[,\n;]+", meal_text) if i.strip()]
            foods, meal_total = [], 0.0

            for item in items:
                kcal = FOOD_DB.get(item.lower(), 120.0)
                foods.append({"name": item, "calories": kcal})
                meal_total += kcal

            meal_details[meal_name] = {
                "foods": foods,
                "meal_calories": round(meal_total, 2)
            }
            daily_total += meal_total

        days_with_details.append({
            "day": day_data.day,
            "meals": meal_details,
            "workout": workout,
            "daily_calories": round(daily_total, 2)
        })
        total_weekly_calories += daily_total

    program = models.Program(
        coach_id=payload.coach_id,
        client_id=payload.client_id,
        title=payload.title,
        notes=payload.notes,
        days=days_with_details,
        calories=round(total_weekly_calories, 2),
    )

    db.add(program)
    db.commit()
    db.refresh(program)
    return program

# -------------------------------------------------------
# 🔹 Récupérer un programme précis
# -------------------------------------------------------
@app.get("/program/{program_id}", response_model=schemas.ProgramOut)
def get_program(program_id: int, db: Session = Depends(get_db)):
    program = db.get(models.Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Programme introuvable")
    return program

# -------------------------------------------------------
# 🔹 Récupérer les programmes d’un client
# (accessible par le client OU son coach)
# -------------------------------------------------------
from .security import verify_token

@app.get("/program/client/{client_id}", response_model=list[schemas.ProgramOut])
def get_programs_by_client(client_id: int, db: Session = Depends(get_db), user=Depends(verify_token)):
    programs = db.query(models.Program).filter(models.Program.client_id == client_id).all()
    if not programs:
        raise HTTPException(status_code=404, detail="Aucun programme trouvé pour ce client.")

    # autorisation : client lui-même ou coach du programme
    if user["user_id"] == client_id or (
        user["role"] == "coach" and any(p.coach_id == user["user_id"] for p in programs)
    ):
        return programs

    raise HTTPException(status_code=403, detail="Accès interdit à ce programme.")

# -------------------------------------------------------
# 🔹 Récupérer tous les programmes (admin / debug)
# -------------------------------------------------------
@app.get("/programs/all")
def get_all_programs(db: Session = Depends(get_db)):
    return db.query(models.Program).all()

# -------------------------------------------------------
# 🔹 Récupérer les programmes d’un coach spécifique
# -------------------------------------------------------
@app.get("/programs/coach/{coach_id}")
def get_programs_by_coach(coach_id: int, db: Session = Depends(get_db)):
    programs = db.query(models.Program).filter(models.Program.coach_id == coach_id).all()
    return programs

# -------------------------------------------------------
# 🔹 Mettre à jour un programme
# -------------------------------------------------------
@app.put("/program/{program_id}", response_model=schemas.ProgramOut)
def update_program(program_id: int, payload: schemas.ProgramCreate, db: Session = Depends(get_db)):
    program = db.get(models.Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Programme introuvable")

    total_weekly_calories = 0.0
    updated_days = []

    for day_data in payload.days:
        meals, meal_details, daily_total = day_data.meals, {}, 0.0

        for meal_name, meal_text in meals.items():
            items = [i.strip() for i in re.split(r"[,\n;]+", meal_text) if i.strip()]
            foods, meal_total = [], 0.0

            for item in items:
                kcal = FOOD_DB.get(item.lower(), 120.0)
                foods.append({"name": item, "calories": kcal})
                meal_total += kcal

            meal_details[meal_name] = {
                "foods": foods,
                "meal_calories": round(meal_total, 2),
            }
            daily_total += meal_total

        updated_days.append({
            "day": day_data.day,
            "meals": meal_details,
            "workout": day_data.workout or "Repos",
            "daily_calories": round(daily_total, 2),
        })
        total_weekly_calories += daily_total

    program.title = payload.title
    program.notes = payload.notes
    program.client_id = payload.client_id
    program.coach_id = payload.coach_id
    program.days = updated_days
    program.calories = round(total_weekly_calories, 2)

    db.commit()
    db.refresh(program)
    return program

# -------------------------------------------------------
# 🔹 Supprimer un programme
# -------------------------------------------------------
@app.delete("/program/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_program(program_id: int, db: Session = Depends(get_db)):
    program = db.query(models.Program).filter(models.Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Programme introuvable")

    db.delete(program)
    db.commit()
    return {"message": "Programme supprimé avec succès"}
