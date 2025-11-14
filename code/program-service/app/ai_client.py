# app/ai_client.py

import os
import json
import openai  # Version >= 1.0

# -----------------------------------------------------------
# 🔑 Récupération de la clé API (ajoute OPENAI_API_KEY dans .env)
# -----------------------------------------------------------
API_KEY = os.getenv("OPENAI_API_KEY")

if not API_KEY:
    print("⚠️ Avertissement : OPENAI_API_KEY n'est pas défini dans les variables d'environnement")

client = openai.OpenAI(api_key=API_KEY)

SYSTEM_PROMPT = """
Tu es un assistant expert en nutrition.
Tu reçois un repas écrit librement, par exemple :

"250g poulet, 100g riz, 1 avocat"

Tu dois retourner STRICTEMENT un JSON du format :

{
  "items": [
    {"name": "poulet 250g", "calories": 412},
    {"name": "riz 100g", "calories": 130},
    {"name": "avocat 1", "calories": 160}
  ],
  "total_calories": 702
}

EXIGENCES :
- calories réalistes
- "items" = liste d’objets
- pas de texte supplémentaire autour du JSON
- pas d'explication
- pas d'autres champs que "items" et "total_calories"
"""

def ask_nutrition_ai(meal_text: str) -> dict:
    """Appelle GPT pour analyser un repas et renvoyer un JSON calories."""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # ou "gpt-4o" si tu veux plus précis
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": meal_text},
            ],
            temperature=0.1,
        )

        raw = response.choices[0].message.content.strip()
        return json.loads(raw)

    except Exception as e:
        print("🔴 ERREUR IA:", e)
        return {}  # fallback
