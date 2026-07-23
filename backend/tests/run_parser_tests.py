"""Runner de tests du parseur, sans dépendance externe (pas de pytest).

Lance :  ./venv/bin/python tests/run_parser_tests.py
Affiche pour chaque ticket les articles/totaux extraits et compare aux
valeurs attendues. Sort en code 1 si au moins un cas échoue.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from modules.ocr.receipt_parser import parse_receipt  # noqa: E402
from tests import fixtures  # noqa: E402

GREEN, RED, DIM, RESET = "\033[32m", "\033[31m", "\033[2m", "\033[0m"
failures = 0


def check(name, condition, detail=""):
    global failures
    mark = f"{GREEN}✓{RESET}" if condition else f"{RED}✗{RESET}"
    print(f"    {mark} {name}" + (f" {DIM}{detail}{RESET}" if detail else ""))
    if not condition:
        failures += 1


def show_articles(result):
    for a in result["articles"]:
        print(
            f"      {DIM}- {a['label']!r} x{a['quantity']} "
            f"= {a['total_price']} (unit {a['unit_price']}){RESET}"
        )


def run_case(key, data):
    print(f"\n{key}")
    result = parse_receipt(data["lines"])
    show_articles(result)
    exp = data["expected"]

    if "articles" in exp and exp["articles"] and len(exp["articles"][0]) == 2:
        # (label, total_price)
        got = [(a["label"], a["total_price"]) for a in result["articles"]]
        check("articles (label, total)", got == exp["articles"],
              f"attendu {len(exp['articles'])}, obtenu {len(got)}")
    elif "articles" in exp:
        # (label, qty, total_price)
        got = [(a["label"], a["quantity"], a["total_price"]) for a in result["articles"]]
        check("articles (label, qté, total)", got == exp["articles"],
              "" if got == exp["articles"] else f"\n      obtenu   {got}\n      attendu  {exp['articles']}")

    if "articles_count" in exp:
        check("nombre d'articles", len(result["articles"]) == exp["articles_count"],
              f"attendu {exp['articles_count']}, obtenu {len(result['articles'])}")

    if "total" in exp:
        check("total", result["totals"]["total"] == exp["total"],
              f"attendu {exp['total']}, obtenu {result['totals']['total']}")

    if "shop" in exp:
        check("enseigne", result["shop"]["name"] == exp["shop"],
              f"attendu {exp['shop']!r}, obtenu {result['shop']['name']!r}")

    if "date" in exp:
        check("date", result["shop"]["date"] == exp["date"],
              f"attendu {exp['date']}, obtenu {result['shop']['date']}")


def main():
    for key, data in fixtures.ALL.items():
        run_case(key, data)
    print()
    if failures:
        print(f"{RED}{failures} vérification(s) en échec{RESET}")
        sys.exit(1)
    print(f"{GREEN}Tous les tickets passent{RESET}")


if __name__ == "__main__":
    main()
