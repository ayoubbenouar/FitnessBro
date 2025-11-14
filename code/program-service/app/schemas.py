# app/schemas.py
from pydantic import BaseModel
from typing import List, Dict, Optional


# -------------------------
# Food / Meals
# -------------------------
class Food(BaseModel):
    name: str
    calories: float


class MealDetails(BaseModel):
    foods: List[Food]
    meal_calories: float


class Meals(BaseModel):
    breakfast: MealDetails
    lunch: MealDetails
    dinner: MealDetails


# -------------------------
# Exercices
# -------------------------
class Exercise(BaseModel):
    name: str
    sets: int
    reps: int


# -------------------------
# Program Day (output)
# -------------------------
class ProgramDay(BaseModel):
    day: str
    meals: Meals
    workout: str
    daily_calories: float
    exercises: List[Exercise] = []


# -------------------------
# Program creation (input)
# -------------------------
class ProgramCreateDay(BaseModel):
    day: str
    meals: Dict[str, str]            # Ex: {"breakfast": "riz, poulet"}
    workout: Optional[str] = "Repos"
    exercises: List[Exercise] = []   # Nouveau


class ProgramCreate(BaseModel):
    coach_id: int
    client_id: int
    title: str
    notes: Optional[str] = None
    days: List[ProgramCreateDay]


# -------------------------
# Program output
# -------------------------
class ProgramOut(BaseModel):
    id: int
    coach_id: int
    client_id: int
    title: str
    notes: Optional[str]
    days: List[ProgramDay]
    calories: float

    # pratique pour l’UI
    coach_email: Optional[str] = None

    class Config:
        from_attributes = True   # Pydantic V1 + V2
