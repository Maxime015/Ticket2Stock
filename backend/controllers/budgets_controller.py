"""Budgets mensuels de l'utilisateur.

Un budget global (category = '') et/ou des budgets par catégorie. L'upsert
crée ou met à jour ; un montant nul ou négatif supprime le budget.
"""
import logging

import psycopg2.extras
from flask import jsonify, request

from config.db import db
from modules.categories import CATEGORY_META, category_meta

logger = logging.getLogger(__name__)


def _serialize(row):
    if row["category"] == "":
        return {"category": "", "label": "Budget global", "emoji": "💶",
                "color": "#6C47FF", "amount": float(row["amount"])}
    return {**category_meta(row["category"]), "amount": float(row["amount"])}


def list_budgets():
    try:
        user_id = request.user["id"]
        with db.get_cursor() as cur:
            cur.execute(
                "SELECT category, amount FROM budgets WHERE user_id = %s",
                (user_id,),
            )
            rows = cur.fetchall()
        return jsonify({"budgets": [_serialize(r) for r in rows]}), 200
    except Exception as error:
        logger.error(f"Erreur lors de la lecture des budgets : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def upsert_budget():
    """Crée/met à jour un budget. { category?: str, amount: number }.
    category absente ou '' = budget global ; amount <= 0 supprime."""
    try:
        user_id = request.user["id"]
        data = request.get_json(silent=True) or {}
        category = (data.get("category") or "").strip()
        if category and category not in CATEGORY_META:
            return jsonify({"message": "Catégorie inconnue."}), 400

        try:
            amount = float(data.get("amount"))
        except (TypeError, ValueError):
            return jsonify({"message": "Montant invalide."}), 400

        with db.get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                if amount <= 0:
                    cur.execute(
                        "DELETE FROM budgets WHERE user_id = %s AND category = %s",
                        (user_id, category),
                    )
                    return jsonify({"message": "Budget supprimé.", "category": category}), 200

                cur.execute(
                    """
                    INSERT INTO budgets (user_id, category, amount)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id, category) DO UPDATE SET
                        amount = EXCLUDED.amount,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING category, amount
                    """,
                    (user_id, category, amount),
                )
                row = cur.fetchone()
        return jsonify({"budget": _serialize(row)}), 200

    except Exception as error:
        logger.error(f"Erreur lors de l'enregistrement du budget : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500
