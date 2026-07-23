import logging

import psycopg2.extras
from flask import jsonify, request

from config.db import db
from modules.categories import categorize
from modules.ocr.receipt_parser import normalize_label

logger = logging.getLogger(__name__)


def list_stock():
    try:
        user_id = request.user["id"]
        with db.get_cursor() as cur:
            cur.execute(
                """
                SELECT id, label, quantity, unit, min_quantity, last_price,
                       last_purchased_at, purchase_count, updated_at,
                       category, expiry_date
                FROM stock_items
                WHERE user_id = %s
                ORDER BY label ASC
                """,
                (user_id,),
            )
            items = cur.fetchall()

        return jsonify({"items": [_serialize(item) for item in items]}), 200

    except Exception as error:
        logger.error(f"Erreur lors de la liste du stock : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def create_stock_item():
    try:
        user_id = request.user["id"]
        data = request.get_json(silent=True) or {}
        label = (data.get("label") or "").strip()
        if not label:
            return jsonify({"message": "Le libellé est requis."}), 400

        with db.get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                normalized = normalize_label(label)
                cur.execute(
                    """
                    INSERT INTO stock_items
                        (user_id, label, normalized_label, quantity, unit,
                         min_quantity, category)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (user_id, normalized_label) DO UPDATE SET
                        quantity = stock_items.quantity + EXCLUDED.quantity,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING *
                    """,
                    (
                        user_id,
                        label,
                        normalized,
                        data.get("quantity", 1),
                        data.get("unit", "pc"),
                        data.get("minQuantity", 1),
                        data.get("category") or categorize(normalized),
                    ),
                )
                item = cur.fetchone()

        return jsonify({"item": _serialize(item)}), 201

    except Exception as error:
        logger.error(f"Erreur lors de la création d'article : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def update_stock_item(item_id):
    """Met à jour quantité et/ou seuil de réapprovisionnement."""
    try:
        user_id = request.user["id"]
        data = request.get_json(silent=True) or {}

        fields, values = [], []
        if "quantity" in data:
            fields.append("quantity = GREATEST(%s, 0)")
            values.append(data["quantity"])
        if "minQuantity" in data:
            fields.append("min_quantity = GREATEST(%s, 0)")
            values.append(data["minQuantity"])
        if "label" in data and (data["label"] or "").strip():
            fields.append("label = %s")
            values.append(data["label"].strip())
            fields.append("normalized_label = %s")
            values.append(normalize_label(data["label"]))
        if "category" in data and data["category"]:
            fields.append("category = %s")
            values.append(data["category"])
        # expiryDate : chaîne "YYYY-MM-DD" pour définir, null pour effacer
        if "expiryDate" in data:
            fields.append("expiry_date = %s::date")
            values.append(data["expiryDate"] or None)
        if not fields:
            return jsonify({"message": "Aucun champ à mettre à jour."}), 400

        fields.append("updated_at = CURRENT_TIMESTAMP")

        with db.get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    f"""
                    UPDATE stock_items SET {', '.join(fields)}
                    WHERE id = %s AND user_id = %s
                    RETURNING *
                    """,
                    (*values, item_id, user_id),
                )
                item = cur.fetchone()

        if not item:
            return jsonify({"message": "Article introuvable."}), 404
        return jsonify({"item": _serialize(item)}), 200

    except Exception as error:
        logger.error(f"Erreur lors de la mise à jour du stock : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def delete_stock_item(item_id):
    try:
        user_id = request.user["id"]
        with db.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM stock_items WHERE id = %s AND user_id = %s",
                    (item_id, user_id),
                )
                if cur.rowcount == 0:
                    return jsonify({"message": "Article introuvable."}), 404
        return jsonify({"message": "Article supprimé."}), 200

    except Exception as error:
        logger.error(f"Erreur lors de la suppression d'article : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def _num(value):
    return float(value) if value is not None else None


def _days_left(expiry):
    """Nombre de jours avant péremption (négatif si déjà périmé)."""
    if not expiry:
        return None
    from datetime import date
    return (expiry - date.today()).days


def _serialize(item):
    expiry = item.get("expiry_date")
    days_left = _days_left(expiry)
    return {
        "id": item["id"],
        "label": item["label"],
        "quantity": _num(item["quantity"]),
        "unit": item["unit"],
        "minQuantity": _num(item["min_quantity"]),
        "lastPrice": _num(item.get("last_price")),
        "lastPurchasedAt": item["last_purchased_at"].isoformat() if item.get("last_purchased_at") else None,
        "purchaseCount": item.get("purchase_count"),
        "isLow": _num(item["quantity"]) <= _num(item["min_quantity"]),
        "category": item.get("category") or "autres",
        "expiryDate": expiry.isoformat() if expiry else None,
        "daysLeft": days_left,
        "isExpiringSoon": days_left is not None and days_left <= 3,
    }
