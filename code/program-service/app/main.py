# app/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
import json
import re
import requests

from .db import Base, engine, get_db
from . import models, schemas
from .security import verify_token
from .redis_client import redis_client

# === OpenAI nouvelle API ===
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("❌ OPENAI_API_KEY manquante dans .env")

if not YOUTUBE_API_KEY:
    raise RuntimeError("❌ YOUTUBE_API_KEY manquante dans .env")

client = OpenAI(api_key=OPENAI_API_KEY)


# ==========================================================
# 🚀 Initialisation FastAPI
# ==========================================================
app = FastAPI(title="FitnessBro Program Service - Nutrition & Training (AI + YouTube)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


# ==========================================================
# ▶️ YouTube API – Recherche vidéo exercice
# ==========================================================
def search_exercise_video(exercise_name: str) -> str:
    """
    Recherche la meilleure vidéo YouTube pour un exercice (démonstration).
    Retourne l’URL complète.
    """

    query = f"{exercise_name} exercise proper form"

    url = "https://www.googleapis.com/youtube/v3/search"

    params = {
        "part": "snippet",
        "q": query,
        "key": YOUTUBE_API_KEY,
        "maxResults": 1,
        "type": "video",
        "videoDuration": "short"
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
    """Endpoint appelé par le frontend pour obtenir une vidéo YouTube"""
    video_url = search_exercise_video(exercise_name)

    if not video_url:
        raise HTTPException(404, "Aucune vidéo trouvée")

    return {"exercise": exercise_name, "video_url": video_url}


# ==========================================================
# 🧠 IA Calories avec Redis Cache
# ==========================================================
async def get_meal_calories_ai(meal_text: str) -> dict:

    cache_key = f"meal_cache:{meal_text.lower().strip()}"
    cached = redis_client.get(cache_key)

    if cached:
        print("⚡ Redis HIT →", meal_text)
        return json.loads(cached)

    print("🧠 IA HIT →", meal_text)

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
            temperature=0
        )

        raw = resp.choices[0].message.content.strip()

        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not json_match:
            raise ValueError("Réponse IA non JSON")

        data = json.loads(json_match.group(0))

        redis_client.setex(cache_key, 60 * 60 * 24, json.dumps(data))
        return data

    except Exception as e:
        print("🔴 ERREUR IA:", e)

        items = [i.strip() for i in re.split(r"[,\n;]+", meal_text) if i.strip()]
        return {
            "foods": [{"name": item, "calories": 120.0} for item in items],
            "meal_calories": float(120 * len(items))
        }


# ==========================================================
# 🛠️ Meal Details
# ==========================================================
async def compute_meal_details(meals: dict):
    details = {}
    day_total = 0.0

    for meal_name, meal_text in meals.items():
        result = await get_meal_calories_ai(meal_text)
        details[meal_name] = result
        day_total += result["meal_calories"]

    return details, round(day_total, 2)


# ==========================================================
# 🩺 Health Check
# ==========================================================
@app.get("/program/health")
def health():
    return {"status": "ok", "service": "program-service"}


# ==========================================================
# ➕ CREATE PROGRAM
# ==========================================================
@app.post("/program", response_model=schemas.ProgramOut, status_code=201)
async def create_program(payload: schemas.ProgramCreate, db: Session = Depends(get_db)):

    week_total = 0
    out_days = []

    for day in payload.days:
        meal_details, kcal = await compute_meal_details(day.meals)

        exercises = getattr(day, "exercises", []) or []

        out_days.append({
            "day": day.day,
            "meals": meal_details,
            "workout": day.workout or "Repos",
            "daily_calories": kcal,
            "exercises": [ex.dict() for ex in exercises]
        })

        week_total += kcal

    program = models.Program(
        coach_id=payload.coach_id,
        client_id=payload.client_id,
        title=payload.title,
        notes=payload.notes,
        days=out_days,
        calories=round(week_total, 2)
    )

    db.add(program)
    db.commit()
    db.refresh(program)

    return program


# ==========================================================
# 🔍 GET Program
# ==========================================================
@app.get("/program/{program_id}", response_model=schemas.ProgramOut)
async def get_program(program_id: int, db: Session = Depends(get_db)):
    program = db.get(models.Program, program_id)
    if not program:
        raise HTTPException(404, "Programme introuvable")
    return program


# ==========================================================
# 🔍 GET Program by client
# ==========================================================
@app.get("/program/client/{client_id}", response_model=list[schemas.ProgramOut])
async def get_programs_by_client(
    client_id: int, db: Session = Depends(get_db), user=Depends(verify_token)
):

    programs = db.query(models.Program).filter(models.Program.client_id == client_id).all()
    if not programs:
        raise HTTPException(404, "Aucun programme trouvé")

    if user["user_id"] == client_id:
        return programs

    if user["role"] == "coach" and any(p.coach_id == user["user_id"] for p in programs):
        return programs

    raise HTTPException(403, "Accès interdit")


# ==========================================================
# ✏️ UPDATE Program
# ==========================================================
@app.put("/program/{program_id}", response_model=schemas.ProgramOut)
async def update_program(
    program_id: int, payload: schemas.ProgramCreate, db: Session = Depends(get_db)
):

    program = db.get(models.Program, program_id)
    if not program:
        raise HTTPException(404, "Programme introuvable")

    week_total = 0
    out_days = []

    for day in payload.days:
        meal_details, kcal = await compute_meal_details(day.meals)
        exercises = getattr(day, "exercises", []) or []

        out_days.append({
            "day": day.day,
            "meals": meal_details,
            "workout": day.workout or "Repos",
            "daily_calories": kcal,
            "exercises": [ex.dict() for ex in exercises]
        })

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


# ==========================================================
# ❌ DELETE Program
# ==========================================================
@app.delete("/program/{program_id}", status_code=204)
async def delete_program(program_id: int, db: Session = Depends(get_db)):
    program = db.query(models.Program).filter(models.Program.id == program_id).first()

    if not program:
        raise HTTPException(404, "Programme introuvable")

    db.delete(program)
    db.commit()

    return {"message": "Programme supprimé"}
