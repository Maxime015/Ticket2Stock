"""Moteur OCR principal : API OCR.space.

Envoie l'image du ticket à l'API OCR.space (moteur 2, français) et
retourne les lignes de texte reconstruites dans l'ordre de lecture.
"""
import base64
import logging

import requests

from config.env import ENV

from .layout import group_words_into_lines

logger = logging.getLogger(__name__)

# Timeout volontairement court : en cas de lenteur on bascule sur EasyOCR
REQUEST_TIMEOUT = 25


class OcrSpaceError(Exception):
    pass


def extract_lines(image_bytes: bytes) -> list[str]:
    """Retourne les lignes de texte du ticket via OCR.space.

    Lève OcrSpaceError si la clé est absente, l'API en erreur ou la
    réponse inexploitable — l'appelant bascule alors sur EasyOCR.
    """
    if not ENV.OCR_API_KEY:
        raise OcrSpaceError("OCR_API_KEY non configurée")

    payload = {
        "apikey": ENV.OCR_API_KEY,
        "language": "fre",
        "OCREngine": 2,
        "isOverlayRequired": True,
        "detectOrientation": True,
        "scale": True,
        "base64Image": "data:image/jpeg;base64," + base64.b64encode(image_bytes).decode("ascii"),
    }

    try:
        response = requests.post(ENV.OCR_SPACE_URL, data=payload, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        body = response.json()
    except requests.RequestException as error:
        raise OcrSpaceError(f"Requête OCR.space échouée : {error}") from error

    if body.get("IsErroredOnProcessing"):
        raise OcrSpaceError(f"OCR.space en erreur : {body.get('ErrorMessage')}")

    parsed_results = body.get("ParsedResults") or []
    if not parsed_results:
        raise OcrSpaceError("OCR.space n'a retourné aucun résultat")

    lines = _lines_from_overlay(parsed_results[0])
    if not lines:
        raise OcrSpaceError("OCR.space n'a détecté aucun texte")
    return lines


def _lines_from_overlay(parsed_result: dict) -> list[str]:
    """Reconstruit les rangées physiques du ticket à partir de l'overlay.

    OCR.space renvoie le libellé (colonne gauche) et le prix (colonne
    droite) comme des « lignes » distinctes : on repart donc des mots et
    de leurs positions pour regrouper ce qui est sur la même rangée.
    """
    overlay_lines = (parsed_result.get("TextOverlay") or {}).get("Lines") or []
    words = []
    for line in overlay_lines:
        for word in line.get("Words") or []:
            text = (word.get("WordText") or "").strip()
            if not text:
                continue
            top = float(word.get("Top", 0))
            height = float(word.get("Height", 0))
            words.append({
                "x": float(word.get("Left", 0)),
                "y_center": top + height / 2,
                "height": height,
                "text": text,
            })

    lines = group_words_into_lines(words)
    if lines:
        return lines

    # Fallback si l'overlay est vide : texte brut ligne par ligne
    parsed_text = parsed_result.get("ParsedText") or ""
    return [l.strip() for l in parsed_text.splitlines() if l.strip()]
