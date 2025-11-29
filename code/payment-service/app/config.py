import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    PROJECT_NAME: str = "FitnessBro Payment Service"

    # Même variable que dans auth-service
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "changeme")
    JWT_ALG: str = "HS256"

    # Stripe
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    STRIPE_PRICE_BASIC: str = os.getenv("STRIPE_PRICE_BASIC", "")
    STRIPE_PRICE_STANDARD: str = os.getenv("STRIPE_PRICE_STANDARD", "")
    STRIPE_PRICE_PREMIUM: str = os.getenv("STRIPE_PRICE_PREMIUM", "")
    STRIPE_PRICE_EXTRA: str = os.getenv("STRIPE_PRICE_EXTRA", "")

    # URL du frontend pour redirection après paiement
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")


settings = Settings()
