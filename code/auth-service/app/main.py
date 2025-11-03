from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from .db import Base, engine, get_db
from . import models, schemas
from .security import hash_password, verify_password, create_access_token

app = FastAPI(title="FitnessBro Auth Service")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crée les tables automatiquement au démarrage
Base.metadata.create_all(bind=engine)

@app.get("/auth/health")
def health():
    return {"status": "ok", "service": "auth-service"}

@app.post("/auth/register", response_model=schemas.UserOut, status_code=201)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    # Vérifier si l'email existe déjà
    existing = db.execute(select(models.User).where(models.User.email == payload.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Email déjà utilisé")

    # Créer un nouvel utilisateur
    user = models.User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.Login, db: Session = Depends(get_db)):
    # Chercher l'utilisateur par email
    user = db.execute(select(models.User).where(models.User.email == payload.email)).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants invalides")

    # Créer un token JWT
    token = create_access_token(sub=str(user.id), role=user.role)
    return {"access_token": token, "token_type": "bearer"}

@app.get("/auth/clients", response_model=list[schemas.UserOut])
def list_clients(db: Session = Depends(get_db)):
    """
    Retourne la liste de tous les utilisateurs ayant le rôle 'client'
    """
    clients = db.query(models.User).filter(models.User.role == "client").all()
    if not clients:
        raise HTTPException(status_code=404, detail="Aucun client trouvé")
    return clients

@app.get("/auth/user/{user_id}")
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return {"id": user.id, "email": user.email, "role": user.role}
