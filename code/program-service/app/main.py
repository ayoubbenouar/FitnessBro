# app/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from openai import OpenAI
import os
import json
import re
import requests

from .db import Base, engine, get_db
from . import models, schemas
from .security import verify_token
from .redis_client import redis_client

load_dotenv()

# Clés API pour OpenAI & YouTube (à définir dans .env)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("❌ OPENAI_API_KEY manquante dans .env")

if not YOUTUBE_API_KEY:
    raise RuntimeError("❌ YOUTUBE_API_KEY manquante dans .env")

# Client OpenAI (nouvelle API)
client = OpenAI(api_key=OPENAI_API_KEY)


 
# Initialisation FastAPI
 
app = FastAPI(
    title="FitnessBro Program Service - Nutrition & Training (AI + YouTube)"
)

# CORS pour le frontend React
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

# Création des tables si non existantes
Base.metadata.create_all(bind=engine)


 
# YouTube API – Recherche vidéo exercice
 
def search_exercise_video(exercise_name: str) -> str:
    """
    Recherche la meilleure vidéo YouTube pour un exercice (démonstration).
    Retourne l’URL complète ou une chaîne vide si rien trouvé.
    """
    query = f"{exercise_name} exercise proper form"
    url = "https://www.googleapis.com/youtube/v3/search"

    params = {
        "part": "snippet",
        "q": query,
        "key": YOUTUBE_API_KEY,
        "maxResults": 1,
        "type": "video",
        "videoDuration": "short",
    }

    try:
        res = requests.get(url, params=params)
        data = res.json()

        if "items" in data and len(data["items"]) > 0:
            video_id = data["items"][0]["id"]["videoId"]
            return f"https://www.youtube.com/watch?v={video_id}"

        return ""

    except Exception as e:
        print("🔴 ERREUR YOUTUBE:", e)
        return ""


@app.get("/program/video/{exercise_name}")
def get_exercise_video(exercise_name: str):
    """
    Endpoint appelé par le frontend pour obtenir une vidéo YouTube
    liée à un exercice.
    """
    video_url = search_exercise_video(exercise_name)

    if not video_url:
        raise HTTPException(404, "Aucune vidéo trouvée")

    return {"exercise": exercise_name, "video_url": video_url}


 
# IA Calories avec Redis Cache
 
async def get_meal_calories_ai(meal_text: str) -> dict:
    """
    Appelle l'IA pour analyser un repas et calcule les calories.
    Utilise Redis pour mettre en cache les réponses sur 24h.
    """
    # 1) Clé de cache basée sur le texte du repas
    cache_key = f"meal_cache:{meal_text.lower().strip()}"
    cached = redis_client.get(cache_key)

    if cached:
        print("⚡ Redis HIT →", meal_text)
        return json.loads(cached)

    print("🧠 IA HIT →", meal_text)

    # 2) Prompt envoyé à l'IA
    prompt = f"""
Analyse précisément les calories pour chaque aliment dans:

"{meal_text}"

Retourne STRICTEMENT un JSON comme ceci:

{{
  "foods": [
    {{"name": "250g poulet", "calories": 415}}
  ],
  "meal_calories": 415
}}

Règles :
- calories selon portion
- rien hors JSON
"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        raw = resp.choices[0].message.content.strip()

        # Extrait le JSON même si l'IA renvoie un peu de texte autour
        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not json_match:
            raise ValueError("Réponse IA non JSON")

        data = json.loads(json_match.group(0))

        # 3) Sauvegarde dans Redis (24h)
        redis_client.setex(cache_key, 60 * 60 * 24, json.dumps(data))

        return data

    except Exception as e:
        print("🔴 ERREUR IA:", e)

        # Fallback simple : chaque item ≈ 120 kcal
        items = [i.strip() for i in re.split(r"[,\n;]+", meal_text) if i.strip()]
        return {
            "foods": [{"name": item, "calories": 120.0} for item in items],
            "meal_calories": float(120 * len(items)),
        }


 
# Meal Details
 
async def compute_meal_details(meals: dict):
    """
    Reçoit un dict brut {"breakfast": "riz, poulet", ...}
    Appelle l'IA pour chaque repas, calcule le total de la journée
    et renvoie :
      - un dict détaillé par repas
      - un total calories pour la journée
    """
    details = {}
    day_total = 0.0

    for meal_name, meal_text in meals.items():
        result = await get_meal_calories_ai(meal_text)
        details[meal_name] = result
        day_total += result["meal_calories"]

    return details, round(day_total, 2)


 
# Health Check
 
@app.get("/program/health")
def health():
    return {"status": "ok", "service": "program-service"}


 
# CREATE PROGRAM
 
@app.post("/program", response_model=schemas.ProgramOut, status_code=201)
async def create_program(
    payload: schemas.ProgramCreate,
    db: Session = Depends(get_db),
):
    """
    Crée un nouveau programme pour un client :
    - calcule les calories par jour via l'IA
    - prépare la structure JSONB
    - stocke le tout en base
    """
    week_total = 0.0
    out_days = []

    for day in payload.days:
        # Détail des repas + total de la journée
        meal_details, kcal = await compute_meal_details(day.meals)

        # Liste d'exercices éventuellement vide
        exercises = getattr(day, "exercises", []) or []

        out_days.append(
            {
                "day": day.day,
                "meals": meal_details,
                "workout": day.workout or "Repos",
                "daily_calories": kcal,
                "exercises": [ex.dict() for ex in exercises],
            }
        )

        week_total += kcal

    program = models.Program(
        coach_id=payload.coach_id,
        client_id=payload.client_id,
        title=payload.title,
        notes=payload.notes,
        days=out_days,
        calories=round(week_total, 2),
    )

    db.add(program)
    db.commit()
    db.refresh(program)

    return program


 
# GET Program by ID
 
@app.get("/program/{program_id}", response_model=schemas.ProgramOut)
async def get_program(program_id: int, db: Session = Depends(get_db)):
    """
    Récupère un programme unique par son ID.
    """
    program = db.get(models.Program, program_id)
    if not program:
        raise HTTPException(404, "Programme introuvable")
    return program


 
# GET Programs by client (sécurisé JWT)
 
@app.get("/program/client/{client_id}", response_model=list[schemas.ProgramOut])
async def get_programs_by_client(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    """
    Récupère les programmes d'un client.
    Droits :
      - le client lui-même
      - le coach qui lui a créé au moins un programme
    """
    programs = (
        db.query(models.Program)
        .filter(models.Program.client_id == client_id)
        .all()
    )

    if not programs:
        raise HTTPException(404, "Aucun programme trouvé")

    # Le client consulte son propre programme
    if user["user_id"] == client_id:
        return programs

    # Un coach peut consulter les programmes de ses clients
    if user["role"] == "coach" and any(
        p.coach_id == user["user_id"] for p in programs
    ):
        return programs

    raise HTTPException(403, "Accès interdit")


 
# GET Programs by coach
 
@app.get("/programs/coach/{coach_id}")
async def get_programs_by_coach(
    coach_id: int,
    db: Session = Depends(get_db),
):
    """
    Récupère tous les programmes créés par un coach.
    (Route surtout utile côté coach / admin).
    """
    programs = (
        db.query(models.Program)
        .filter(models.Program.coach_id == coach_id)
        .all()
    )
    return programs


 
# UPDATE Program
 
@app.put("/program/{program_id}", response_model=schemas.ProgramOut)
async def update_program(
    program_id: int,
    payload: schemas.ProgramCreate,
    db: Session = Depends(get_db),
):
    """
    Met à jour un programme existant :
    - recalcule les calories (car repas/exos ont pu changer)
    - met à jour les jours et le total hebdo
    """
    program = db.get(models.Program, program_id)
    if not program:
        raise HTTPException(404, "Programme introuvable")

    week_total = 0.0
    out_days = []

    for day in payload.days:
        meal_details, kcal = await compute_meal_details(day.meals)
        exercises = getattr(day, "exercises", []) or []

        out_days.append(
            {
                "day": day.day,
                "meals": meal_details,
                "workout": day.workout or "Repos",
                "daily_calories": kcal,
                "exercises": [ex.dict() for ex in exercises],
            }
        )

        week_total += kcal

    program.title = payload.title
    program.notes = payload.notes
    program.client_id = payload.client_id
    program.coach_id = payload.coach_id
    program.days = out_days
    program.calories = round(week_total, 2)

    db.commit()
    db.refresh(program)

    return program


 
# DELETE Program
 
@app.delete("/program/{program_id}", status_code=204)
async def delete_program(program_id: int, db: Session = Depends(get_db)):
    """
    Supprime un programme définitivement.
    """
    program = (
        db.query(models.Program)
        .filter(models.Program.id == program_id)
        .first()
    )

    if not program:
        raise HTTPException(404, "Programme introuvable")

    db.delete(program)
    db.commit()

    return {"message": "Programme supprimé"}
