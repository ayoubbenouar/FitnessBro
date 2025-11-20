# app/schemas.py
from pydantic import BaseModel
from typing import List, Dict, Optional


 
# Food / Meals (sortie IA)
 
class Food(BaseModel):
    name: str
    calories: float


class MealDetails(BaseModel):
    """
    Détail d'un repas :
    - liste d'aliments (foods)
    - total calories du repas (meal_calories)
    """
    foods: List[Food]
    meal_calories: float


class Meals(BaseModel):
    """
    Structure standardisée des repas d'une journée.
    """
    breakfast: MealDetails
    lunch: MealDetails
    dinner: MealDetails


 
# Exercices
 
class Exercise(BaseModel):
    name: str
    sets: int
    reps: int


 
# Program Day (OUTPUT)
 
class ProgramDay(BaseModel):
    """
    Jour d'un programme renvoyé au frontend.
    """
    day: str
    meals: Meals
    workout: str
    daily_calories: float
    exercises: List[Exercise] = []


 
# Program creation (INPUT)
 
class ProgramCreateDay(BaseModel):
    """
    Structure reçue lors de la création/mise à jour :
    - meals = dict brut : {"breakfast": "riz, poulet", ...}
      → qui sera transformé par l'IA en MealDetails.
    """
    day: str
    meals: Dict[str, str]            # Ex: {"breakfast": "riz, poulet"}
    workout: Optional[str] = "Repos"
    exercises: List[Exercise] = []   # Liste d'exercices optionnelle


class ProgramCreate(BaseModel):
    coach_id: int
    client_id: int
    title: str
    notes: Optional[str] = None
    days: List[ProgramCreateDay]


 
# Program output
 
class ProgramOut(BaseModel):
    id: int
    coach_id: int
    client_id: int
    title: str
    notes: Optional[str]
    days: List[ProgramDay]
    calories: float

    # Afficher l email du coach si necessaire
    coach_email: Optional[str] = None

    class Config:
        # Compatible Pydantic v1 et v2
        orm_mode = True
        from_attributes = True
