# app/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from .models import User

from .db import Base, engine, get_db
from . import models, schemas
from .security import hash_password, verify_password, create_access_token
import requests


app = FastAPI(title="FitnessBro Auth Service")

# CORS pour le frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Création des tables SQL
Base.metadata.create_all(bind=engine)


# Health Check
@app.get("/auth/health")
def health():
    return {"status": "ok", "service": "auth-service"}


# ================================
#   INSCRIPTION COACH
# ================================
@app.post("/auth/register", response_model=schemas.UserOut, status_code=201)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):

    existing = db.execute(
        select(models.User).where(models.User.email == payload.email)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(409, "Email déjà utilisé")

    if payload.role != "coach":
        raise HTTPException(400, "Seuls les coachs peuvent s'inscrire via cette route.")

    user = models.User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="coach",
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ================================
#   LOGIN
# ================================
@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.Login, db: Session = Depends(get_db)):

    user = db.execute(
        select(models.User).where(models.User.email == payload.email)
    ).scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Identifiants invalides")

    token = create_access_token(sub=str(user.id), role=user.role)
    return {"access_token": token, "token_type": "bearer"}


# ================================
#   CRÉATION CLIENT PAR COACH
# ================================
@app.post("/auth/clients/{coach_id}/add", response_model=schemas.UserOut)
def create_client_for_coach(
    coach_id: int,
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
):

    # 1) Nombre actuel de clients
    current_clients = (
        db.query(models.User)
        .filter(models.User.coach_id == coach_id)
        .count()
    )

    # 2) Vérification limite via payment-service
    limit_res = requests.get(
        f"http://127.0.0.1:8007/payment/subscription/{coach_id}/limit",
        params={"current_clients": current_clients},
        timeout=3
    )

    if limit_res.status_code != 200:
        raise HTTPException(500, "Erreur lors de la vérification de la limite.")

    limit = limit_res.json()

    if not limit.get("can_add", False):
        raise HTTPException(
            400,
            f"Limite atteinte : {limit['current_clients']}/{limit['max_clients']} clients."
        )

    # 3) Vérification email unique
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(400, "Email déjà utilisé")

    # 4) Création du client
    client = models.User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="client",
        coach_id=coach_id,
    )

    db.add(client)
    db.commit()
    db.refresh(client)
    return client



# ================================
#   LISTE DES CLIENTS DU COACH
# ================================
@app.get("/auth/clients/{coach_id}", response_model=list[schemas.UserOut])
def list_clients_for_coach(coach_id: int, db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.coach_id == coach_id).all()


# Liste de tous les clients (admin/debug)
@app.get("/auth/clients", response_model=list[schemas.UserOut])
def list_all_clients(db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.role == "client").all()


# ================================
#   GET USER BY ID
# ================================
@app.get("/auth/user/{user_id}")
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)

    if not user:
        raise HTTPException(404, "Utilisateur introuvable")

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "coach_id": user.coach_id,
    }


# ================================
#   SUPPRESSION D’UN CLIENT
# ================================
@app.delete("/auth/clients/{client_id}", status_code=204)
def delete_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(models.User).filter(
        models.User.id == client_id,
        models.User.role == "client"
    ).first()

    if not client:
        raise HTTPException(404, "Client introuvable")

    db.delete(client)
    db.commit()
    return {"message": "Client supprimé avec succès"}


# ================================
#   DEBUG : TOUS LES USERS
# ================================
@app.get("/auth/all-users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email} for u in users]
