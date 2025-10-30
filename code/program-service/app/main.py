from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .db import Base, engine, get_db
from . import models, schemas
import re
from typing import Dict, Any

# ----------------------------
# Initialisation de l'application
# ----------------------------
app = FastAPI(title="FitnessBro Program Service - Weekly Nutrition & Training")

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
# Base locale d'aliments (kcal / 100g)
# ----------------------------
FOOD_DB = {
    # viandes
    "poulet": 239, "chicken": 239,
    "boeuf": 250, "beef": 250,
    "poisson": 200, "fish": 200,
    "oeuf": 155, "egg": 155,
    # féculents
    "riz": 130, "rice": 130,
    "pâtes": 131, "pasta": 131,
    "pain": 265, "bread": 265,
    "patates": 77, "potato": 77,
    # fruits & légumes
    "avocat": 160, "avocado": 160,
    "pomme": 52, "apple": 52,
    "banane": 89, "banana": 89,
    "brocoli": 34, "broccoli": 34,
    "tomate": 18, "tomato": 18,
    # divers
    "lait": 42, "milk": 42,
    "fromage": 350, "cheese": 350,
    "yaourt": 60, "yogurt": 60,
    "huile": 884, "oil": 884,
}

# ----------------------------
# Fonction utilitaire : estimation des calories
# ----------------------------
def estimate_calories(text: str) -> float:
    total = 0.0
    words = re.split(r"[,\n; ]+", text.lower())
    for word in words:
        if not word.strip():
            continue
        kcal = FOOD_DB.get(word.strip(), 120.0)
        total += kcal
    return round(total, 2)

# ----------------------------
# Création du programme complet
# ----------------------------
@app.get("/program/health")
def health():
    return {"status": "ok", "service": "program-service"}

@app.post("/program", response_model=schemas.ProgramOut, status_code=201)
def create_program(payload: schemas.ProgramCreate, db: Session = Depends(get_db)):
    """
    Crée un programme complet (7 jours, 3 repas/jour + entraînement)
    et calcule les calories de chaque aliment, repas et jour.
    """
    if not payload.days or len(payload.days) == 0:
        raise HTTPException(status_code=400, detail="Aucun jour fourni dans le programme.")

    total_weekly_calories = 0.0
    days_with_details = []

    for day_data in payload.days:
        meals = day_data.meals
        workout = day_data.workout or "Repos"

        meal_details = {}
        daily_total = 0.0

        for meal_name, meal_text in meals.items():
            # découper les aliments
            items = [i.strip() for i in re.split(r"[,\n;]+", meal_text) if i.strip()]
            foods = []
            meal_total = 0.0

            for item in items:
                kcal = FOOD_DB.get(item.lower(), 120.0)
                foods.append({"name": item, "calories": kcal})
                meal_total += kcal

            meal_details[meal_name] = {
                "foods": foods,
                "meal_calories": round(meal_total, 2)
            }
            daily_total += meal_total

        daily_total = round(daily_total, 2)
        total_weekly_calories += daily_total

        days_with_details.append({
            "day": day_data.day,
            "meals": meal_details,      # repas → aliments → kcal
            "workout": workout,
            "daily_calories": daily_total
        })

    total_weekly_calories = round(total_weekly_calories, 2)

    program = models.Program(
        coach_id=payload.coach_id,
        client_id=payload.client_id,
        title=payload.title,
        notes=payload.notes,
        days=days_with_details,
        calories=total_weekly_calories
    )

    db.add(program)
    db.commit()
    db.refresh(program)
    return program


@app.get("/program/{program_id}", response_model=schemas.ProgramOut)
def get_program(program_id: int, db: Session = Depends(get_db)):
    program = db.get(models.Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Programme introuvable")
    return program
