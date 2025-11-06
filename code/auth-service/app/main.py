from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from .db import Base, engine, get_db
from . import models, schemas
from .security import hash_password, verify_password, create_access_token

# -------------------------------------------------
# 🔹 Initialisation de l'application
# -------------------------------------------------
app = FastAPI(title="FitnessBro Auth Service")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# -------------------------------------------------
# 🔹 Vérification du service
# -------------------------------------------------
@app.get("/auth/health")
def health():
    return {"status": "ok", "service": "auth-service"}


# -------------------------------------------------
# 🔹 Inscription coach (page signup)
# -------------------------------------------------
@app.post("/auth/register", response_model=schemas.UserOut, status_code=201)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Permet l'inscription d'un coach uniquement.
    """
    existing = db.execute(
        select(models.User).where(models.User.email == payload.email)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=409, detail="Email déjà utilisé")

    # 🚫 Seuls les rôles "coach" sont autorisés ici
    if payload.role not in ["coach"]:
        raise HTTPException(
            status_code=400,
            detail="Création de compte réservée aux coachs uniquement",
        )

    user = models.User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# -------------------------------------------------
# 🔹 Connexion (coach + client)
# -------------------------------------------------
@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.Login, db: Session = Depends(get_db)):
    """
    Authentifie un coach ou un client et retourne un token JWT.
    """
    user = (
        db.execute(select(models.User).where(models.User.email == payload.email))
        .scalar_one_or_none()
    )

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants invalides")

    token = create_access_token(sub=str(user.id), role=user.role)
    return {"access_token": token, "token_type": "bearer"}


# -------------------------------------------------
# 🔹 Création d’un client par un coach
# -------------------------------------------------
@app.post("/auth/clients/{coach_id}/add", response_model=schemas.UserOut)
def create_client_for_coach(coach_id: int, payload: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Permet à un coach de créer un client lié à son propre ID.
    """
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    new_client = models.User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="client",
        coach_id=coach_id,
    )

    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client


# -------------------------------------------------
# 🔹 Liste des clients d’un coach spécifique
# -------------------------------------------------
@app.get("/auth/clients/{coach_id}", response_model=list[schemas.UserOut])
def list_clients_for_coach(coach_id: int, db: Session = Depends(get_db)):
    """
    Retourne uniquement les clients appartenant au coach connecté.
    """
    clients = db.query(models.User).filter(models.User.coach_id == coach_id).all()
    return clients


# -------------------------------------------------
# 🔹 Liste de tous les clients (debug ou admin)
# -------------------------------------------------
@app.get("/auth/clients", response_model=list[schemas.UserOut])
def list_all_clients(db: Session = Depends(get_db)):
    """
    Retourne la liste de tous les utilisateurs ayant le rôle 'client'.
    """
    clients = db.query(models.User).filter(models.User.role == "client").all()
    return clients


# -------------------------------------------------
# 🔹 Récupération d’un utilisateur par son ID
# -------------------------------------------------
@app.get("/auth/user/{user_id}")
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    """
    Retourne les infos d’un utilisateur selon son ID.
    """
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "coach_id": user.coach_id,
    }
