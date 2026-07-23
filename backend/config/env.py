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
    # OCR.space — moteur OCR (EasyOCR sert de fallback local)
    OCR_API_KEY = os.getenv("OCR_API_KEY")
    OCR_SPACE_URL = os.getenv("OCR_SPACE_URL", "https://api.ocr.space/parse/image")
    # Gemini — moteur d'extraction prioritaire (vision LLM → JSON structuré)
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    GEMINI_API_URL = os.getenv(
        "GEMINI_API_URL", "https://generativelanguage.googleapis.com/v1beta/models"
    )
    DEBUG = NODE_ENV == "development"

ENV = Config()
