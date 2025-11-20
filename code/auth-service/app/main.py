# app/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select

from .db import Base, engine, get_db
from . import models, schemas
from .security import hash_password, verify_password, create_access_token


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



# Inscription Coach (réservée aux coachs)

@app.post("/auth/register", response_model=schemas.UserOut, status_code=201)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Inscription réservée aux *coachs*.
    Les clients doivent être créés par un coach.
    """
    # Vérification email unique
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


#  Connexion (coach + client)

@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.Login, db: Session = Depends(get_db)):
    # Recherche de l'utilisateur
    user = db.execute(
        select(models.User).where(models.User.email == payload.email)
    ).scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Identifiants invalides")

    token = create_access_token(sub=str(user.id), role=user.role)
    return {"access_token": token, "token_type": "bearer"}


 
#  Création d’un client par un coach

@app.post("/auth/clients/{coach_id}/add", response_model=schemas.UserOut)
def create_client_for_coach(
    coach_id: int,
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    """
    Un coach peut enregistrer un client rattaché à son compte.
    """
    # Vérifier si email déjà pris
    existing = db.query(models.User).filter(models.User.email == payload.email).first()

    if existing:
        raise HTTPException(400, "Email déjà utilisé")

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


 
# 👥 Liste des clients d’un coach
  
@app.get("/auth/clients/{coach_id}", response_model=list[schemas.UserOut])
def list_clients_for_coach(coach_id: int, db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.coach_id == coach_id).all()


  
# 👥 Liste de tous les clients (debug/admin)
 
@app.get("/auth/clients", response_model=list[schemas.UserOut])
def list_all_clients(db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.role == "client").all()


 
# 🔍 Récupérer un utilisateur par ID
 
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


 
# 🗑️ Suppression d’un client
 
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
