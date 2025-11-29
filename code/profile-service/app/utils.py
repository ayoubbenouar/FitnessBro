# app/utils.py
from typing import Optional, Tuple
from .models import Profile


def compute_bmr_tdee(
    sex: Optional[str],
    weight_kg: Optional[float],
    height_cm: Optional[float],
    age: Optional[int],
    activity_level: Optional[str],
) -> Tuple[Optional[float], Optional[float]]:
    """
    Calcule BMR (Métabolisme de base) et TDEE (dépense journalière)
    avec la formule de Mifflin-St Jeor.

    Renvoie (bmr, tdee) ou (None, None) si données insuffisantes.
    """

    if sex is None or weight_kg is None or height_cm is None or age is None:
        return None, None

    sex = sex.lower()
    if sex not in ("male", "homme", "m", "female", "femme", "f"):
        return None, None

    if sex in ("male", "homme", "m"):
        # Mifflin-St Jeor homme
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        # Mifflin-St Jeor femme
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    # Facteurs d’activité
    factors = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "high": 1.725,
        "athlete": 1.9,
    }

    factor = None
    if activity_level:
        key = activity_level.lower()
        factor = factors.get(key)

    if factor is None:
        # par défaut : sédentaire
        factor = 1.2

    tdee = bmr * factor
    return round(bmr, 2), round(tdee, 2)


def update_profile_metrics(profile: Profile) -> None:
    """
    Met à jour BMR/TDEE d'un profil si possible.
    """
    bmr, tdee = compute_bmr_tdee(
        sex=profile.sex,
        weight_kg=profile.weight_kg,
        height_cm=profile.height_cm,
        age=profile.age,
        activity_level=profile.activity_level,
    )
    profile.bmr = bmr
    profile.tdee = tdee
