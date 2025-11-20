# app/redis_client.py
import redis

# Client Redis utilisé pour le cache des réponses IA
redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    decode_responses=True,  # on reçoit des str directement
)
