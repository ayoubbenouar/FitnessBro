from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# --- Modèles de base ---
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

class ProgramDay(BaseModel):
    day: str
    meals: Meals
    workout: str
    daily_calories: float

# --- Création (input) ---
class ProgramCreateDay(BaseModel):
    day: str
    meals: Dict[str, str]  # ← texte simple envoyé (poulet, riz)
    workout: Optional[str] = "Repos"

class ProgramCreate(BaseModel):
    coach_id: int
    client_id: int
    title: str
    notes: Optional[str] = None
    days: List[ProgramCreateDay]

# --- Sortie (output) ---
class ProgramOut(BaseModel):
    id: int
    coach_id: int
    client_id: int
    title: str
    notes: Optional[str]
    days: List[ProgramDay]
    calories: float

    # ✅ Champ supplémentaire pour afficher l’auteur côté client
    coach_email: Optional[str] = None

    class Config:
        from_attributes = True
