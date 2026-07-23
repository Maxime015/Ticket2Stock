import base64
import json
import logging

import psycopg2.extras
from flask import jsonify, request

from config.db import db
from modules.categories import categorize
from modules.ocr import extract_receipt_data
from modules.ocr.receipt_parser import normalize_label

logger = logging.getLogger(__name__)


def scan_ticket():
    """OCR + parsing d'un ticket. Ne persiste rien : le mobile affiche le
    résultat pour validation avant l'appel à save_ticket."""
    try:
        data = request.get_json(silent=True) or {}
        base64_string = data.get("base64String")
        if not base64_string:
            return jsonify({"message": "Le champ base64String est requis."}), 400

        try:
            image = base64.b64decode(base64_string, validate=True)
        except Exception:
            return jsonify({"message": "Image base64 invalide."}), 400

        result = extract_receipt_data(image)
        logger.info(
            "Scan: moteur=%s, %d lignes OCR, %d articles, enseigne=%s",
            result.get("ocr_engine"),
            len(result.get("raw_lines") or []),
            len(result.get("articles") or []),
            (result.get("shop") or {}).get("name"),
        )
        return jsonify(result), 200

    except Exception as error:
        logger.error(f"Erreur lors du scan du ticket : {error}", exc_info=True)
        return jsonify({"message": "Impossible d'analyser le ticket."}), 500


def save_ticket():
    """Persiste un ticket validé par l'utilisateur, ses articles, et met à
    jour le stock (upsert par libellé normalisé)."""
    try:
        user_id = request.user["id"]
        data = request.get_json(silent=True) or {}

        shop = data.get("shop") or {}
        articles = data.get("articles") or []
        totals = data.get("totals") or {}

        if not articles:
            return jsonify({"message": "Aucun article à enregistrer."}), 400

        with db.get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO tickets
                        (user_id, shop_name, purchase_date, total, total_ht,
                         total_tva, nb_articles, ocr_engine, raw_json)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, created_at
                    """,
                    (
                        user_id,
                        shop.get("name") or "",
                        shop.get("date"),
                        totals.get("total"),
                        totals.get("total_ht"),
                        totals.get("total_tva"),
                        shop.get("nb_articles") or len(articles),
                        data.get("ocr_engine") or "",
                        json.dumps(data, ensure_ascii=False),
                    ),
                )
                ticket = cur.fetchone()

                for article in articles:
                    label = (article.get("label") or "").strip()
                    if not label:
                        continue
                    normalized = article.get("normalized_label") or normalize_label(label)
                    quantity = article.get("quantity") or 1
                    unit = article.get("unit") or "pc"
                    unit_price = article.get("unit_price")
                    total_price = article.get("total_price")
                    category = article.get("category") or categorize(normalized)

                    cur.execute(
                        """
                        INSERT INTO ticket_items
                            (ticket_id, label, normalized_label, quantity,
                             unit_price, total_price, confidence, category)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (ticket["id"], label, normalized, quantity,
                         unit_price, total_price, article.get("confidence"), category),
                    )

                    # Alimente le stock : cumul de quantité si l'article existe déjà
                    cur.execute(
                        """
                        INSERT INTO stock_items
                            (user_id, label, normalized_label, quantity, unit,
                             last_price, last_purchased_at, category)
                        VALUES (%s, %s, %s, %s, %s, %s, COALESCE(%s::date, CURRENT_DATE), %s)
                        ON CONFLICT (user_id, normalized_label) DO UPDATE SET
                            quantity = stock_items.quantity + EXCLUDED.quantity,
                            label = EXCLUDED.label,
                            last_price = COALESCE(EXCLUDED.last_price, stock_items.last_price),
                            last_purchased_at = EXCLUDED.last_purchased_at,
                            category = EXCLUDED.category,
                            purchase_count = stock_items.purchase_count + 1,
                            updated_at = CURRENT_TIMESTAMP
                        """,
                        (user_id, label, normalized, quantity, unit,
                         unit_price, shop.get("date"), category),
                    )

                # Les articles achetés sortent de la liste de courses
                normalized_labels = [
                    article.get("normalized_label") or normalize_label(article.get("label") or "")
                    for article in articles if article.get("label")
                ]
                if normalized_labels:
                    cur.execute(
                        """
                        DELETE FROM shopping_list_items
                        WHERE user_id = %s
                          AND stock_item_id IN (
                              SELECT id FROM stock_items
                              WHERE user_id = %s AND normalized_label = ANY(%s)
                          )
                        """,
                        (user_id, user_id, normalized_labels),
                    )

        return jsonify({
            "message": "Ticket enregistré, stock mis à jour.",
            "ticketId": ticket["id"],
        }), 201

    except Exception as error:
        logger.error(f"Erreur lors de l'enregistrement du ticket : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def list_tickets():
    try:
        user_id = request.user["id"]
        with db.get_cursor() as cur:
            cur.execute(
                """
                SELECT t.id, t.shop_name, t.purchase_date, t.total,
                       t.nb_articles, t.created_at,
                       COUNT(ti.id) AS items_count
                FROM tickets t
                LEFT JOIN ticket_items ti ON ti.ticket_id = t.id
                WHERE t.user_id = %s
                GROUP BY t.id
                ORDER BY t.created_at DESC
                LIMIT 50
                """,
                (user_id,),
            )
            tickets = cur.fetchall()

        return jsonify({"tickets": [_serialize_ticket(t) for t in tickets]}), 200

    except Exception as error:
        logger.error(f"Erreur lors de la liste des tickets : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def get_ticket(ticket_id):
    try:
        user_id = request.user["id"]
        with db.get_cursor() as cur:
            cur.execute(
                "SELECT * FROM tickets WHERE id = %s AND user_id = %s",
                (ticket_id, user_id),
            )
            ticket = cur.fetchone()
            if not ticket:
                return jsonify({"message": "Ticket introuvable."}), 404

            cur.execute(
                """
                SELECT id, label, quantity, unit_price, total_price, category
                FROM ticket_items WHERE ticket_id = %s ORDER BY id
                """,
                (ticket_id,),
            )
            items = cur.fetchall()

        payload = _serialize_ticket(ticket)
        payload["totalHt"] = _num(ticket.get("total_ht"))
        payload["totalTva"] = _num(ticket.get("total_tva"))
        payload["items"] = [
            {
                "id": item["id"],
                "label": item["label"],
                "quantity": _num(item["quantity"]),
                "unitPrice": _num(item["unit_price"]),
                "totalPrice": _num(item["total_price"]),
                "category": item.get("category") or "autres",
            }
            for item in items
        ]
        return jsonify(payload), 200

    except Exception as error:
        logger.error(f"Erreur lors de la lecture du ticket : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def delete_ticket(ticket_id):
    try:
        user_id = request.user["id"]
        with db.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM tickets WHERE id = %s AND user_id = %s",
                    (ticket_id, user_id),
                )
                if cur.rowcount == 0:
                    return jsonify({"message": "Ticket introuvable."}), 404
        return jsonify({"message": "Ticket supprimé."}), 200

    except Exception as error:
        logger.error(f"Erreur lors de la suppression du ticket : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def _num(value):
    return float(value) if value is not None else None


def _serialize_ticket(ticket):
    return {
        "id": ticket["id"],
        "shopName": ticket["shop_name"],
        "purchaseDate": ticket["purchase_date"].isoformat() if ticket.get("purchase_date") else None,
        "total": _num(ticket.get("total")),
        "nbArticles": ticket.get("nb_articles"),
        "itemsCount": ticket.get("items_count"),
        "createdAt": ticket["created_at"].isoformat() if ticket.get("created_at") else None,
    }
