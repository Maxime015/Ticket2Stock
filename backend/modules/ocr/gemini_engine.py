"""Moteur d'extraction Gemini (vision LLM).

Contrairement à OCR.space/EasyOCR qui rendent du texte à re-parser par
`receipt_parser`, Gemini lit directement la photo du ticket et renvoie le
ticket déjà structuré (enseigne, date, articles catégorisés, totaux). Cela
gère bien mieux les mises en page complexes, les libellés sur plusieurs
lignes et les catégories, tout en produisant la même forme de dict.

Nécessite GEMINI_API_KEY. Si absente, `is_configured()` renvoie False et le
pipeline bascule sur OCR.space puis EasyOCR.
"""
import base64
import json
import logging
import re
from datetime import datetime

import requests

from config.env import ENV

from ..categories import CATEGORY_META, categorize
from .receipt_parser import normalize_label

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 40
_CATEGORY_KEYS = list(CATEGORY_META.keys())

PROMPT = (
    "Tu es un extracteur de tickets de caisse. Analyse l'image du ticket et "
    "renvoie UNIQUEMENT un JSON structuré des ARTICLES RÉELLEMENT ACHETÉS.\n"
    "Règles :\n"
    "- Ignore les lignes qui ne sont pas des produits : sous-totaux, TOTAL, TVA, "
    "taxes, remises, rendu monnaie, moyens de paiement, points fidélité, en-têtes.\n"
    "- Regroupe les libellés écrits sur plusieurs lignes en un seul libellé propre.\n"
    "- quantity : nombre d'unités ; pour un article vendu au poids, unit='kg' et "
    "quantity = le poids en kg. Sinon unit='pc'.\n"
    "- total_price = prix total payé pour la ligne ; unit_price = prix unitaire si visible.\n"
    "- Prix en nombres décimaux (point décimal), sans symbole monétaire.\n"
    "- purchase_date au format ISO AAAA-MM-JJ si présente, sinon null.\n"
    "- category : choisis la clé la plus adaptée parmi : " + ", ".join(_CATEGORY_KEYS) + ".\n"
    "N'invente aucun article : n'extrais que ce qui est lisible sur le ticket."
)

_ARTICLE_SCHEMA = {
    "type": "object",
    "properties": {
        "label": {"type": "string"},
        "quantity": {"type": "number"},
        "unit": {"type": "string", "enum": ["pc", "kg"]},
        "unit_price": {"type": "number", "nullable": True},
        "total_price": {"type": "number", "nullable": True},
        "category": {"type": "string", "enum": _CATEGORY_KEYS},
    },
    "required": ["label", "quantity", "unit", "total_price", "category"],
}

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "shop_name": {"type": "string"},
        "purchase_date": {"type": "string", "nullable": True},
        "articles": {"type": "array", "items": _ARTICLE_SCHEMA},
        "total": {"type": "number", "nullable": True},
        "total_ht": {"type": "number", "nullable": True},
        "total_tva": {"type": "number", "nullable": True},
    },
    "required": ["shop_name", "articles"],
}


class GeminiError(Exception):
    pass


def is_configured() -> bool:
    return bool(ENV.GEMINI_API_KEY)


def _coerce_float(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return round(float(value), 2)
    try:
        return round(float(str(value).replace(",", ".").replace("€", "").strip()), 2)
    except (TypeError, ValueError):
        return None


def _clean_date(value):
    if not value:
        return None
    match = re.search(r"(\d{4})-(\d{2})-(\d{2})", str(value))
    if not match:
        return None
    try:
        y, m, d = (int(g) for g in match.groups())
        return datetime(y, m, d).date().isoformat()
    except ValueError:
        return None


def extract_receipt(image_bytes: bytes) -> dict:
    """Extrait le ticket structuré via Gemini. Lève GeminiError en cas d'échec."""
    if not is_configured():
        raise GeminiError("GEMINI_API_KEY non configurée")

    url = f"{ENV.GEMINI_API_URL}/{ENV.GEMINI_MODEL}:generateContent"
    body = {
        "contents": [{
            "parts": [
                {"text": PROMPT},
                {"inline_data": {
                    "mime_type": "image/jpeg",
                    "data": base64.b64encode(image_bytes).decode("ascii"),
                }},
            ],
        }],
        "generationConfig": {
            "temperature": 0,
            "responseMimeType": "application/json",
            "responseSchema": RESPONSE_SCHEMA,
        },
    }

    try:
        response = requests.post(
            url,
            headers={"x-goog-api-key": ENV.GEMINI_API_KEY},
            json=body,
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as error:
        raise GeminiError(f"Requête Gemini échouée : {error}") from error

    try:
        text = payload["candidates"][0]["content"]["parts"][0]["text"]
        data = json.loads(text)
    except (KeyError, IndexError, json.JSONDecodeError, TypeError) as error:
        raise GeminiError(f"Réponse Gemini inexploitable : {error}") from error

    return _to_result(data)


def _to_result(data: dict) -> dict:
    """Normalise la sortie Gemini vers la forme attendue par l'app."""
    articles = []
    for raw in data.get("articles") or []:
        label = (raw.get("label") or "").strip()
        if not label:
            continue
        normalized = normalize_label(label)
        total_price = _coerce_float(raw.get("total_price"))
        unit_price = _coerce_float(raw.get("unit_price"))
        quantity = raw.get("quantity") or 1
        try:
            quantity = float(quantity)
            quantity = int(quantity) if quantity.is_integer() else round(quantity, 3)
        except (TypeError, ValueError):
            quantity = 1
        unit = raw.get("unit") if raw.get("unit") in ("pc", "kg") else "pc"
        # La catégorie de Gemini fait foi si valide, sinon repli sur nos règles
        category = raw.get("category")
        if category not in CATEGORY_META:
            category = categorize(normalized)
        if unit_price is None and total_price is not None and quantity:
            unit_price = round(total_price / float(quantity), 2)

        articles.append({
            "label": label,
            "quantity": quantity,
            "unit": unit,
            "unit_price": unit_price,
            "total_price": total_price,
            "normalized_label": normalized,
            "category": category,
        })

    total = _coerce_float(data.get("total"))
    if total is None and articles:
        total = round(sum(a["total_price"] or 0 for a in articles), 2)

    return {
        "shop": {
            "name": (data.get("shop_name") or "").strip(),
            "date": _clean_date(data.get("purchase_date")),
            "nb_articles": len(articles),
        },
        "articles": articles,
        "totals": {
            "total": total,
            "total_ht": _coerce_float(data.get("total_ht")),
            "total_tva": _coerce_float(data.get("total_tva")),
        },
        "raw_lines": [
            f"{a['label']} {a['total_price'] if a['total_price'] is not None else ''}".strip()
            for a in articles
        ],
    }
