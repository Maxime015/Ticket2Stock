"""Tableau de bord des dépenses.

Agrège les tickets et leurs articles pour l'écran Stats du mobile :
total du mois, évolution, panier moyen, répartition par catégorie,
courbe sur 6 mois, top produits / enseignes, et suivi des budgets.
"""
import csv
import io
import logging

from flask import Response, jsonify, request

from config.db import db
from modules.categories import category_meta

logger = logging.getLogger(__name__)

# Date effective d'un ticket : date d'achat lue sur le ticket, sinon date de scan.
EFFECTIVE_DATE = "COALESCE(t.purchase_date, t.created_at::date)"

MONTHS_FR = [
    "janv.", "févr.", "mars", "avr.", "mai", "juin",
    "juil.", "août", "sept.", "oct.", "nov.", "déc.",
]
MONTHS_FR_LONG = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]


def _f(value):
    return round(float(value), 2) if value is not None else 0.0


def get_overview():
    try:
        user_id = request.user["id"]
        with db.get_cursor() as cur:
            # --- Total & nombre de tickets du mois en cours + mois précédent ---
            cur.execute(
                f"""
                SELECT
                    COALESCE(SUM(total) FILTER (
                        WHERE {EFFECTIVE_DATE} >= date_trunc('month', CURRENT_DATE)
                    ), 0) AS month_total,
                    COUNT(*) FILTER (
                        WHERE {EFFECTIVE_DATE} >= date_trunc('month', CURRENT_DATE)
                    ) AS month_count,
                    COALESCE(SUM(total) FILTER (
                        WHERE {EFFECTIVE_DATE} >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
                          AND {EFFECTIVE_DATE} <  date_trunc('month', CURRENT_DATE)
                    ), 0) AS prev_total
                FROM tickets t
                WHERE t.user_id = %s
                """,
                (user_id,),
            )
            totals = cur.fetchone()
            month_total = _f(totals["month_total"])
            prev_total = _f(totals["prev_total"])
            month_count = int(totals["month_count"] or 0)

            # --- Courbe des 6 derniers mois ---
            cur.execute(
                f"""
                SELECT to_char(date_trunc('month', {EFFECTIVE_DATE}), 'YYYY-MM') AS ym,
                       COALESCE(SUM(total), 0) AS amount
                FROM tickets t
                WHERE t.user_id = %s
                  AND {EFFECTIVE_DATE} >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
                GROUP BY 1
                """,
                (user_id,),
            )
            by_month = {row["ym"]: _f(row["amount"]) for row in cur.fetchall()}

            # --- Répartition par catégorie (mois en cours) ---
            cur.execute(
                f"""
                SELECT ti.category,
                       COALESCE(SUM(ti.total_price), 0) AS amount,
                       COUNT(*) AS n
                FROM ticket_items ti
                JOIN tickets t ON t.id = ti.ticket_id
                WHERE t.user_id = %s
                  AND {EFFECTIVE_DATE} >= date_trunc('month', CURRENT_DATE)
                GROUP BY ti.category
                ORDER BY amount DESC
                """,
                (user_id,),
            )
            categories = [
                {**category_meta(row["category"]),
                 "amount": _f(row["amount"]), "count": int(row["n"])}
                for row in cur.fetchall() if _f(row["amount"]) > 0
            ]

            # --- Top produits (tout l'historique) ---
            cur.execute(
                """
                SELECT ti.normalized_label,
                       MAX(ti.label) AS label,
                       MAX(ti.category) AS category,
                       COALESCE(SUM(ti.total_price), 0) AS amount,
                       COALESCE(SUM(ti.quantity), 0) AS qty,
                       COUNT(DISTINCT ti.ticket_id) AS times
                FROM ticket_items ti
                JOIN tickets t ON t.id = ti.ticket_id
                WHERE t.user_id = %s
                GROUP BY ti.normalized_label
                ORDER BY amount DESC
                LIMIT 6
                """,
                (user_id,),
            )
            top_products = [
                {"label": row["label"], "category": row["category"],
                 "amount": _f(row["amount"]), "quantity": _f(row["qty"]),
                 "times": int(row["times"])}
                for row in cur.fetchall() if _f(row["amount"]) > 0
            ]

            # --- Top enseignes (tout l'historique) ---
            cur.execute(
                """
                SELECT NULLIF(shop_name, '') AS shop,
                       COALESCE(SUM(total), 0) AS amount,
                       COUNT(*) AS n
                FROM tickets t
                WHERE t.user_id = %s AND shop_name <> ''
                GROUP BY shop
                ORDER BY amount DESC
                LIMIT 5
                """,
                (user_id,),
            )
            top_shops = [
                {"shop": row["shop"], "amount": _f(row["amount"]), "count": int(row["n"])}
                for row in cur.fetchall() if row["shop"]
            ]

            # --- Budgets : dépensé du mois vs montant fixé ---
            cur.execute(
                "SELECT category, amount FROM budgets WHERE user_id = %s",
                (user_id,),
            )
            budget_rows = cur.fetchall()

        spent_by_cat = {c["category"]: c["amount"] for c in categories}
        global_budget = None
        category_budgets = []
        for row in budget_rows:
            amount = _f(row["amount"])
            if row["category"] == "":
                global_budget = {"amount": amount, "spent": month_total}
            else:
                category_budgets.append({
                    **category_meta(row["category"]),
                    "amount": amount,
                    "spent": spent_by_cat.get(row["category"], 0.0),
                })
        category_budgets.sort(key=lambda b: b["amount"], reverse=True)

        # Série continue sur 6 mois (mois vides à 0)
        from datetime import date
        today = date.today()
        series = []
        for offset in range(5, -1, -1):
            m = today.month - offset
            y = today.year
            while m <= 0:
                m += 12
                y -= 1
            ym = f"{y:04d}-{m:02d}"
            series.append({
                "month": ym,
                "label": MONTHS_FR[m - 1],
                "total": by_month.get(ym, 0.0),
            })

        delta_pct = None
        if prev_total > 0:
            delta_pct = round((month_total - prev_total) / prev_total * 100)

        return jsonify({
            "month": f"{today.year:04d}-{today.month:02d}",
            "monthLabel": f"{MONTHS_FR_LONG[today.month - 1]} {today.year}",
            "monthTotal": month_total,
            "prevMonthTotal": prev_total,
            "deltaPct": delta_pct,
            "ticketCount": month_count,
            "avgBasket": round(month_total / month_count, 2) if month_count else 0.0,
            "series": series,
            "categories": categories,
            "topProducts": top_products,
            "topShops": top_shops,
            "budgets": {"global": global_budget, "categories": category_budgets},
        }), 200

    except Exception as error:
        logger.error(f"Erreur lors du calcul des stats : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def _fr_amount(value):
    """Nombre à la française pour Excel (virgule décimale), vide si None."""
    return f"{float(value):.2f}".replace(".", ",") if value is not None else ""


def export_csv():
    """Exporte tous les articles achetés en CSV (séparateur ';', pour Excel FR)."""
    try:
        user_id = request.user["id"]
        with db.get_cursor() as cur:
            cur.execute(
                f"""
                SELECT {EFFECTIVE_DATE} AS date,
                       t.shop_name,
                       ti.label,
                       ti.category,
                       ti.quantity,
                       ti.unit_price,
                       ti.total_price
                FROM ticket_items ti
                JOIN tickets t ON t.id = ti.ticket_id
                WHERE t.user_id = %s
                ORDER BY date DESC NULLS LAST, t.id, ti.label
                """,
                (user_id,),
            )
            rows = cur.fetchall()

        buffer = io.StringIO()
        writer = csv.writer(buffer, delimiter=";")
        writer.writerow([
            "Date", "Enseigne", "Produit", "Catégorie",
            "Quantité", "Prix unitaire (€)", "Prix total (€)",
        ])
        for r in rows:
            writer.writerow([
                r["date"].isoformat() if r["date"] else "",
                r["shop_name"] or "",
                r["label"],
                category_meta(r["category"])["label"],
                _fr_amount(r["quantity"]),
                _fr_amount(r["unit_price"]),
                _fr_amount(r["total_price"]),
            ])

        # BOM UTF-8 pour qu'Excel affiche correctement les accents
        payload = "﻿" + buffer.getvalue()
        response = Response(payload, mimetype="text/csv; charset=utf-8")
        response.headers["Content-Disposition"] = 'attachment; filename="depenses.csv"'
        return response

    except Exception as error:
        logger.error(f"Erreur lors de l'export CSV : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500
