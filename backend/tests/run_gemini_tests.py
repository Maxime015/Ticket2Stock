"""Tests hors-ligne de la normalisation Gemini (`_to_result`), sans réseau.

Vérifie que la sortie brute d'un modèle Gemini est bien nettoyée vers la forme
attendue par l'app : dates ISO, catégories validées, quantités/prix cohérents.

Lance :  ./venv/bin/python tests/run_gemini_tests.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from modules.ocr.gemini_engine import _to_result  # noqa: E402

GREEN, RED, DIM, RESET = "\033[32m", "\033[31m", "\033[2m", "\033[0m"
failures = 0


def check(name, condition, detail=""):
    global failures
    mark = f"{GREEN}✓{RESET}" if condition else f"{RED}✗{RESET}"
    print(f"    {mark} {name}" + (f" {DIM}{detail}{RESET}" if detail else ""))
    if not condition:
        failures += 1


def main():
    raw = {
        "shop_name": "  Carrefour  ",
        "purchase_date": "20/11/2024",  # format non ISO → doit être ignoré
        "articles": [
            {"label": "Café Espresso", "quantity": 1, "unit": "pc",
             "unit_price": None, "total_price": 5.5, "category": "boissons"},
            {"label": "Bananes", "quantity": 1.25, "unit": "kg",
             "total_price": 3.0, "category": "INVALIDE"},  # → repli catégorisation
            {"label": "   ", "quantity": 1, "unit": "pc",
             "total_price": 1.0, "category": "autres"},     # libellé vide → ignoré
        ],
        "total": None,  # absent → recalculé depuis les articles
        "total_ht": "8,20",  # string FR → float
        "total_tva": None,
    }
    r = _to_result(raw)

    print("gemini _to_result")
    check("libellé vide ignoré (2 articles)", len(r["articles"]) == 2,
          f"obtenu {len(r['articles'])}")
    check("enseigne trimée", r["shop"]["name"] == "Carrefour", r["shop"]["name"])
    check("date non-ISO → null", r["shop"]["date"] is None, str(r["shop"]["date"]))

    cafe, banane = r["articles"][0], r["articles"][1]
    check("unit_price calculé si absent", cafe["unit_price"] == 5.5,
          str(cafe["unit_price"]))
    check("catégorie invalide → repli règles", banane["category"] == "fruits_legumes",
          banane["category"])
    check("unit kg conservé", banane["unit"] == "kg", banane["unit"])
    check("unit_price poids = total/qté", banane["unit_price"] == round(3.0 / 1.25, 2),
          str(banane["unit_price"]))
    check("normalized_label présent", cafe["normalized_label"] == "CAFE ESPRESSO",
          cafe["normalized_label"])

    check("total recalculé depuis articles", r["totals"]["total"] == 8.5,
          str(r["totals"]["total"]))
    check("total_ht string FR → float", r["totals"]["total_ht"] == 8.2,
          str(r["totals"]["total_ht"]))

    print()
    if failures:
        print(f"{RED}{failures} vérification(s) en échec{RESET}")
        sys.exit(1)
    print(f"{GREEN}Normalisation Gemini OK{RESET}")


if __name__ == "__main__":
    main()
