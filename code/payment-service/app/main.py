from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .routes import checkout, subscription
from .webhooks import stripe_webhook
from .config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# CORS pour ton frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


@app.get("/payment/health")
def health():
    return {"status": "ok", "service": "payment-service"}


app.include_router(checkout.router)
app.include_router(subscription.router)
app.include_router(stripe_webhook.router)
