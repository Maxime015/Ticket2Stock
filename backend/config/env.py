import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = os.getenv("PORT", 8080)
    NODE_ENV = os.getenv("NODE_ENV", "development")
    DATABASE_URL = os.getenv("DATABASE_URL")
    ARCJET_KEY = os.getenv("ARCJET_KEY")
    UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL")
    UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")
    JWT_SECRET = os.getenv("JWT_SECRET")
    DEBUG = NODE_ENV == "development"

ENV = Config()