"""Moteur OCR de secours : EasyOCR (local).

Utilisé quand OCR.space est indisponible (pas de clé, quota, réseau).
Les boîtes détectées sont regroupées par ligne (même hauteur) puis
triées de gauche à droite pour reconstituer le texte du ticket.
"""
import logging

from .layout import group_words_into_lines

logger = logging.getLogger(__name__)

_reader = None


def _get_reader():
    # Import paresseux : EasyOCR charge torch (~2 Go), on ne paie ce coût
    # que si le fallback est réellement utilisé.
    global _reader
    if _reader is None:
        import easyocr
        _reader = easyocr.Reader(["fr"], gpu=False)
    return _reader


def extract_lines(image_bytes: bytes) -> list[str]:
    """Retourne les lignes de texte du ticket via EasyOCR."""
    results = _get_reader().readtext(image_bytes)
    words = []
    for bbox, text, prob in results:
        text = text.strip()
        if not text:
            continue
        xs = [point[0] for point in bbox]
        ys = [point[1] for point in bbox]
        words.append({
            "x": min(xs),
            "y_center": (min(ys) + max(ys)) / 2,
            "height": max(ys) - min(ys),
            "text": text,
        })
    return group_words_into_lines(words)
