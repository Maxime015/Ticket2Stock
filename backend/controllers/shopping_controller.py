import logging

import psycopg2.extras
from flask import jsonify, request

from config.db import db

logger = logging.getLogger(__name__)


def list_shopping():
    try:
        user_id = request.user["id"]
        with db.get_cursor() as cur:
            cur.execute(
                """
                SELECT id, label, quantity, checked, source, stock_item_id, created_at
                FROM shopping_list_items
                WHERE user_id = %s
                ORDER BY checked ASC, created_at DESC
                """,
                (user_id,),
            )
            items = cur.fetchall()

        return jsonify({"items": [_serialize(item) for item in items]}), 200

    except Exception as error:
        logger.error(f"Erreur lors de la liste de courses : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def generate_shopping_list():
    """Génère automatiquement la liste : tous les articles du stock dont la
    quantité est passée sous le seuil, sans dupliquer ceux déjà listés."""
    try:
        user_id = request.user["id"]
        with db.get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO shopping_list_items
                        (user_id, stock_item_id, label, quantity, source)
                    SELECT s.user_id, s.id, s.label,
                           GREATEST(s.min_quantity - s.quantity, 1), 'auto'
                    FROM stock_items s
                    WHERE s.user_id = %s
                      AND s.quantity <= s.min_quantity
                      AND NOT EXISTS (
                          SELECT 1 FROM shopping_list_items l
                          WHERE l.user_id = s.user_id
                            AND l.stock_item_id = s.id
                            AND l.checked = FALSE
                      )
                    RETURNING id
                    """,
                    (user_id,),
                )
                added = cur.fetchall()

        return jsonify({
            "message": f"{len(added)} article(s) ajouté(s) à la liste.",
            "addedCount": len(added),
        }), 200

    except Exception as error:
        logger.error(f"Erreur lors de la génération de la liste : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def add_shopping_item():
    try:
        user_id = request.user["id"]
        data = request.get_json(silent=True) or {}
        label = (data.get("label") or "").strip()
        if not label:
            return jsonify({"message": "Le libellé est requis."}), 400

        with db.get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO shopping_list_items (user_id, label, quantity, source)
                    VALUES (%s, %s, %s, 'manual')
                    RETURNING *
                    """,
                    (user_id, label, data.get("quantity", 1)),
                )
                item = cur.fetchone()

        return jsonify({"item": _serialize(item)}), 201

    except Exception as error:
        logger.error(f"Erreur lors de l'ajout à la liste : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def toggle_shopping_item(item_id):
    try:
        user_id = request.user["id"]
        with db.get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    """
                    UPDATE shopping_list_items SET checked = NOT checked
                    WHERE id = %s AND user_id = %s
                    RETURNING *
                    """,
                    (item_id, user_id),
                )
                item = cur.fetchone()

        if not item:
            return jsonify({"message": "Élément introuvable."}), 404
        return jsonify({"item": _serialize(item)}), 200

    except Exception as error:
        logger.error(f"Erreur lors du cochage : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def delete_shopping_item(item_id):
    try:
        user_id = request.user["id"]
        with db.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM shopping_list_items WHERE id = %s AND user_id = %s",
                    (item_id, user_id),
                )
                if cur.rowcount == 0:
                    return jsonify({"message": "Élément introuvable."}), 404
        return jsonify({"message": "Élément supprimé."}), 200

    except Exception as error:
        logger.error(f"Erreur lors de la suppression : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def clear_checked():
    """Supprime tous les éléments cochés (fin de courses)."""
    try:
        user_id = request.user["id"]
        with db.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM shopping_list_items WHERE user_id = %s AND checked = TRUE",
                    (user_id,),
                )
                deleted = cur.rowcount
        return jsonify({"message": f"{deleted} élément(s) supprimé(s)."}), 200

    except Exception as error:
        logger.error(f"Erreur lors du nettoyage de la liste : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def _serialize(item):
    return {
        "id": item["id"],
        "label": item["label"],
        "quantity": float(item["quantity"]) if item["quantity"] is not None else 1,
        "checked": item["checked"],
        "source": item["source"],
        "stockItemId": item.get("stock_item_id"),
        "createdAt": item["created_at"].isoformat() if item.get("created_at") else None,
    }
