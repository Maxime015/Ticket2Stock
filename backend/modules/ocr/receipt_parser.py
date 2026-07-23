"""Parseur de tickets de caisse français.

Transforme les lignes de texte OCR en données structurées :
enseigne, date d'achat, articles (libellé, quantité, prix), totaux.

Formats gérés (ALDI, LIDL, Carrefour, etc.) :
    BOULETTES BOEUF 900G          6,99 € 1
     1 x 6,99 €
    A PAYER                      13,52 €
    TOTAL HT                     12,82
"""
import re
import unicodedata
from datetime import datetime

from ..categories import categorize

KNOWN_SHOPS = [
    "ALDI", "LIDL", "CARREFOUR", "LECLERC", "E.LECLERC", "AUCHAN",
    "INTERMARCHE", "INTERMARCHÉ", "MONOPRIX", "FRANPRIX", "CASINO",
    "SUPER U", "HYPER U", "SYSTEME U", "GRAND FRAIS", "PICARD",
    "NETTO", "SPAR", "G20", "BIOCOOP", "NATURALIA", "MATCH", "CORA",
]

# Montant type "6,99", "13.52", "$2.15", éventuellement suivi de "€"/"CHF"
PRICE_RE = re.compile(
    r"(\d{1,4})\s*[,.]\s*(\d{2})\s*(?:€|EUR|CHF|\$|£)?", re.IGNORECASE
)
# Ligne de quantité type "1 x 6,99 €" ou "2 X 1,99"
QTY_RE = re.compile(r"^\s*(\d{1,3})\s*[xX*]\s*(\d{1,4})\s*[,.]\s*(\d{2})")
# Préfixe quantité collé au libellé : "2xLatte", "3 x Café"
LEADING_QTY_X_RE = re.compile(r"^\s*(\d{1,3})\s*[xX]\s*(?=\D)")
# Poids type "0,456 kg x 2,99 €/kg"
WEIGHT_RE = re.compile(r"(\d+[,.]\d{1,3})\s*kg", re.IGNORECASE)
DATE_RE = re.compile(r"(\d{2})[/.\-](\d{2})[/.\-](\d{2,4})")
# Symboles / mots monétaires et pointillés à retirer en fin de libellé
CURRENCY_STRIP_RE = re.compile(
    r"(?:[\s.·•:$£€*-]|\bCHF\b|\bEUR\b|\bUSD\b|\bà\b)+$", re.IGNORECASE
)

TOTAL_KEYWORDS = ("A PAYER", "TOTAL TTC", "MONTANT DU", "NET A PAYER", "TOTAL A PAYER")
# Lignes qui ne sont jamais des articles (FR / EN / DE)
NOISE_KEYWORDS = (
    "TOTAL", "A PAYER", "MONTANT", "TVA", "HT ", " HT", "TTC", "CB", "CARTE",
    "ESPECES", "RENDU", "MERCI", "HORAIRES", "OUVERTURE", "VENTE", "TEL",
    "SIRET", "TICKET", "CAISSE", "NOMBRE", "LIGNES", "ARTICLES", "GARANTIE",
    "CONFORMITE", "IDENTIFIES", "AVIS", "WWW", "HTTP", "BIENVENUE", "CLIENT",
    "FIDELITE", "REMISE", "CUMUL", "SOLDE", "POINTS", "LUN", "SAM", "DIM",
    "REGLEMENT", "RÈGLEMENT", "TAUX",
    # Anglais
    "THANK", "RECEIPT", "COMPANY", "ADDRESS", "MANAGER", "DESCRIPTION", "TAX",
    # Allemand / suisse
    "RECH", "MWST", "INCL", "ENTSPRICHT", "BEDIENTE", "TISCH",
)


def normalize_label(label: str) -> str:
    """Libellé canonique pour rapprocher les articles entre tickets."""
    text = unicodedata.normalize("NFKD", label)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^A-Za-z0-9 ]", " ", text)
    return re.sub(r"\s+", " ", text).strip().upper()


def _to_amount(match: re.Match) -> float:
    return float(f"{match.group(1)}.{match.group(2)}")


def _is_noise(upper_line: str) -> bool:
    return any(keyword in upper_line for keyword in NOISE_KEYWORDS)


def _clean_label(label: str) -> str:
    """Retire pointillés de remplissage et symboles monétaires en bord de libellé."""
    label = CURRENCY_STRIP_RE.sub("", label.strip())
    return label.strip(" .-·•:*\t")


def _make_article(label: str, quantity, unit_price, total_price: float) -> dict | None:
    """Construit un article si le libellé est plausible (≥ 2 lettres)."""
    if sum(c.isalpha() for c in label) < 2:
        return None
    weight_match = WEIGHT_RE.search(label)
    if weight_match:
        quantity = float(weight_match.group(1).replace(",", "."))
    return {
        "label": label,
        "quantity": quantity,
        "unit": "kg" if weight_match else "pc",
        "unit_price": unit_price,
        "total_price": total_price,
    }


def _parse_article_line(stripped: str) -> dict | None:
    """Extrait un article d'une ligne, en gérant plusieurs mises en page :

    - "Orange Juice $2.15"                    → libellé + prix
    - "Bracelet ATARA 1 225,00 2"             → libellé, quantité, prix, code TVA
    - "2xLatte Macchiato à 4.50 CHF 9.00"     → quantité collée, prix unit., total
    - "Café ......... 5,50 €"                 → pointillés de remplissage
    """
    price_matches = list(PRICE_RE.finditer(stripped))
    if not price_matches:
        return None

    last_price = price_matches[-1]
    total_price = _to_amount(last_price)
    before = stripped[: last_price.start()]

    # 1) Préfixe quantité "2x" + colonnes prix_unitaire / total (restaurants)
    xmatch = LEADING_QTY_X_RE.match(stripped)
    if xmatch and len(price_matches) >= 2:
        qty = int(xmatch.group(1))
        unit_candidate = _to_amount(price_matches[-2])
        if abs(unit_candidate * qty - total_price) < 0.05:
            label = _clean_label(stripped[xmatch.end(): price_matches[-2].start()])
            return _make_article(label, qty, unit_candidate, total_price)

    # 2) Colonnes "LIBELLÉ QTÉ PRIX <code TVA>" : un petit entier suit le prix
    tail = stripped[last_price.end():].strip(" €$£.")
    if re.fullmatch(r"\d{1,2}", tail):
        quantity = 1
        qty_tok = re.search(r"(\d{1,3})\s*$", before)
        if qty_tok:
            quantity = int(qty_tok.group(1))
            before = before[: qty_tok.start()]
        return _make_article(_clean_label(before), quantity, None, total_price)

    # 3) Format restaurant "N LIBELLÉ  PRIX_UNIT  TOTAL" (quantité en tête, 2 prix)
    label = _clean_label(before)
    quantity, unit_price = 1, None
    qty_prefix = re.match(r"(\d{1,3})\s+\D", label)
    if qty_prefix and len(price_matches) >= 2:
        qty = int(qty_prefix.group(1))
        unit_candidate = _to_amount(price_matches[-2])
        if qty > 1 and abs(unit_candidate * qty - total_price) < 0.02:
            quantity = qty
            unit_price = unit_candidate
            label = re.sub(
                r"^\d{1,3}\s+", "", _clean_label(stripped[: price_matches[-2].start()])
            )

    # Retire un code TVA resté collé au libellé ("6,99 € 1")
    label = re.sub(r"\s+\d$", "", label)
    return _make_article(label, quantity, unit_price, total_price)


def _find_shop(lines: list[str]) -> str:
    for line in lines[:8]:
        # Les enseignes sont souvent imprimées lettres espacées ("A L D I")
        squashed = normalize_label(line).replace(" ", "")
        for shop in KNOWN_SHOPS:
            if normalize_label(shop).replace(" ", "") in squashed:
                return shop.title() if shop.isupper() else shop
    # À défaut : première ligne courte sans chiffre en tête de ticket
    for line in lines[:3]:
        if not any(c.isdigit() for c in line) and 2 < len(line.strip()) <= 30:
            return line.strip()
    return ""


def _find_date(lines: list[str]) -> str | None:
    for line in lines:
        match = DATE_RE.search(line)
        if not match:
            continue
        day, month, year = match.groups()
        year = f"20{year}" if len(year) == 2 else year
        try:
            return datetime(int(year), int(month), int(day)).date().isoformat()
        except ValueError:
            continue
    return None


def _find_labeled_amount(lines: list[str], keywords: tuple[str, ...]) -> float | None:
    for line in lines:
        upper = line.upper()
        if any(keyword in upper for keyword in keywords):
            prices = PRICE_RE.findall(line)
            if prices:
                whole, cents = prices[-1]
                return float(f"{whole}.{cents}")
    return None


def _find_article_count(lines: list[str]) -> int | None:
    for line in lines:
        upper = line.upper()
        if "ARTICLE" in upper or "LIGNE" in upper:
            digits = re.findall(r"\d+", line)
            if digits:
                return int(digits[-1])
    return None


def parse_receipt(lines: list[str]) -> dict:
    """Transforme les lignes OCR en ticket structuré (dict JSON-ready)."""
    articles = []
    reached_totals = False

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        upper = stripped.upper()

        # Ligne de quantité "2 x 1,99" : complète l'article précédent
        qty_match = QTY_RE.match(stripped)
        if qty_match and articles:
            quantity = int(qty_match.group(1))
            unit_price = float(f"{qty_match.group(2)}.{qty_match.group(3)}")
            last = articles[-1]
            last["quantity"] = quantity
            last["unit_price"] = unit_price
            # La ligne de quantité fait autorité : le prix capté sur la ligne
            # d'article peut être le prix unitaire et non le total de ligne
            last["total_price"] = round(quantity * unit_price, 2)
            continue

        has_price = PRICE_RE.search(stripped) is not None
        # La zone des totaux commence au premier "A PAYER" / "TOTAL … montant"
        if any(keyword in upper for keyword in TOTAL_KEYWORDS) or (
            "TOTAL" in upper and has_price
        ):
            reached_totals = True

        if reached_totals or _is_noise(upper):
            continue

        article = _parse_article_line(stripped)
        if article:
            articles.append(article)

    total = _find_labeled_amount(lines, TOTAL_KEYWORDS)
    if total is None:
        # Ligne "TOTAL 141,40" sans mention TTC (mais pas TOTAL HT/TVA)
        total = _find_labeled_amount(
            [l for l in lines if "TOTAL" in l.upper()
             and "HT" not in l.upper() and "TVA" not in l.upper()],
            ("TOTAL",),
        )
    if total is None and articles:
        total = round(sum(a["total_price"] or 0 for a in articles), 2)

    for article in articles:
        article["normalized_label"] = normalize_label(article["label"])
        article["category"] = categorize(article["normalized_label"])
        if article["unit_price"] is None and article["quantity"]:
            article["unit_price"] = round(
                (article["total_price"] or 0) / float(article["quantity"]), 2
            )

    return {
        "shop": {
            "name": _find_shop(lines),
            "date": _find_date(lines),
            "nb_articles": _find_article_count(lines) or len(articles),
        },
        "articles": articles,
        "totals": {
            "total": total,
            "total_ht": _find_labeled_amount(lines, ("TOTAL HT", "HT")),
            "total_tva": _find_labeled_amount(lines, ("TOTAL TVA",)),
        },
        "raw_lines": lines,
    }
