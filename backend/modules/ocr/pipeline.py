"""Pipeline d'extraction : image de ticket -> données structurées.

1. Gemini (vision LLM) : extraction structurée directe, la plus précise, si
   GEMINI_API_KEY est configurée.
2. OCR.space : OCR cloud, texte re-parsé par receipt_parser.
3. EasyOCR : fallback OCR local si l'API est indisponible.
"""
import logging

from . import easyocr_engine, gemini_engine, ocr_space
from .gemini_engine import GeminiError
from .ocr_space import OcrSpaceError
from .receipt_parser import parse_receipt

logger = logging.getLogger(__name__)


def extract_receipt_data(image_bytes: bytes) -> dict:
    # 1) Gemini en priorité : lit l'image et renvoie déjà le ticket structuré
    if gemini_engine.is_configured():
        try:
            result = gemini_engine.extract_receipt(image_bytes)
            if result.get("articles"):
                result["ocr_engine"] = "gemini"
                return result
            logger.warning("Gemini n'a détecté aucun article, repli OCR.space/EasyOCR")
        except GeminiError as error:
            logger.warning(f"Gemini indisponible ({error}), repli OCR.space/EasyOCR")

    # 2) OCR.space, puis 3) EasyOCR — texte re-parsé par receipt_parser
    engine = "ocr.space"
    try:
        lines = ocr_space.extract_lines(image_bytes)
    except OcrSpaceError as error:
        logger.warning(f"OCR.space indisponible ({error}), fallback EasyOCR")
        engine = "easyocr"
        lines = easyocr_engine.extract_lines(image_bytes)

    result = parse_receipt(lines)
    result["ocr_engine"] = engine
    return result
