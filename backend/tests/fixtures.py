"""Jeux de tickets de référence pour tester le parseur.

Chaque fixture reproduit la sortie OCR (une string par rangée lue) d'un
ticket réel fourni comme image, avec le résultat attendu après parsing.
Les images sources correspondantes :
  - receipt_generic : template anglais "RECEIPT / COMPANY NAME"
  - mykomela        : ticket vêtements FR (colonnes Article/Qté/Prix + code TVA)
  - berghotel       : ticket restaurant CH (format "2xLibellé à 4.50 CHF 9.00")
  - carrefour       : ticket FR à pointillés "Libellé .... 14,90 €"
"""

# --- Ticket 1 : template anglais générique, prix en dollars -----------------
RECEIPT_GENERIC = {
    "lines": [
        "RECEIPT",
        "COMPANY NAME",
        "Address: Lorem Ipsum 8/24",
        "Date: MM/DD/YYYY",
        "Manager: Lorem Ipsum",
        "Description Price",
        "Orange Juice $2.15",
        "Apples $3.50",
        "Tomato $2.40",
        "Fish $6.99",
        "Beef $10.00",
        "Onion $1.25",
        "Cheese $3.40",
        "Tax",
        "TOTAL $29.69",
        "THANK YOU",
        "1234567789963578021",
    ],
    "expected": {
        "articles": [
            ("Orange Juice", 2.15),
            ("Apples", 3.50),
            ("Tomato", 2.40),
            ("Fish", 6.99),
            ("Beef", 10.00),
            ("Onion", 1.25),
            ("Cheese", 3.40),
        ],
        "total": 29.69,
    },
}

# --- Ticket 2 : MYKOMELA, vêtements, colonnes Qté/Prix + code TVA de fin -----
MYKOMELA = {
    "lines": [
        "MYKOMELA",
        "DEMO FRINGUE1",
        "Siège principal",
        "15, rue des Lilas",
        "97420 Le Port",
        "Ticket n°JP_T210002 du 26/02/2021-12:20",
        "CAISSE : JP-Jean PERIN",
        "CLIENT COMPTANT",
        "Article Qté Prix",
        "Bracelet ATARA 1 225,00 2",
        "Pantalon Pedal super stretch denim Bleu S 2 45,00 2",
        "Robe STERIA Almond Flowers Almond 34 1 159,70 2",
        "Pantalon Baker super stretch denim Bleu S 1 45,00 2",
        "Pantalon Britney blue stretch denim Bleu S 3 75,00 2",
        "Tweetshirt à capuche Bège 1 49,90 2",
        "Nombre d'articles 9",
        "Total TTC en Euro 599,60",
        "Règlement : Espèce 599,60",
        "HT Taux TVA TTC",
        "2 552,63 8.5 46,97 599,60",
    ],
    "expected": {
        "articles": [
            ("Bracelet ATARA", 1, 225.00),
            ("Pantalon Pedal super stretch denim Bleu S", 2, 45.00),
            ("Robe STERIA Almond Flowers Almond 34", 1, 159.70),
            ("Pantalon Baker super stretch denim Bleu S", 1, 45.00),
            ("Pantalon Britney blue stretch denim Bleu S", 3, 75.00),
            ("Tweetshirt à capuche Bège", 1, 49.90),
        ],
        "total": 599.60,
        "shop": "MYKOMELA",
        "date": "2021-02-26",
    },
}

# --- Ticket 3 : Berghotel (CH), format "2xLibellé à prix_unit CHF total" -----
BERGHOTEL = {
    "lines": [
        "Berghotel",
        "Grosse Scheidegg",
        "3818 Grindelwald",
        "Familie R.Müller",
        "Rech.Nr. 4572 30.07.2007/13:29:17",
        "Bar Tisch 7/01",
        "2xLatte Macchiato à 4.50 CHF 9.00",
        "1xGloki à 5.00 CHF 5.00",
        "1xSchweinschnitzel à 22.00 CHF 22.00",
        "1xChässpätzli à 18.50 CHF 18.50",
        "Total : CHF 54.50",
        "Incl. 7.6% MwSt 54.50 CHF: 3.85",
        "Entspricht in Euro 36.33 EUR",
        "Es bediente Sie: Ursula",
        "MwSt Nr.: 430 234",
        "Tel.: 033 853 67 16",
    ],
    "expected": {
        "articles": [
            ("Latte Macchiato", 2, 9.00),
            ("Gloki", 1, 5.00),
            ("Schweinschnitzel", 1, 22.00),
            ("Chässpätzli", 1, 18.50),
        ],
        "total": 54.50,
        "date": "2007-07-30",
    },
}

# --- Ticket 4 : Carrefour (FR), pointillés de remplissage -------------------
CARREFOUR = {
    "lines": [
        "Carrefour",
        "27000 ÉVREUX",
        "**BIENVENUE**",
        "Caisse 14",
        "Mardi 20 novembre",
        "DVD « L'Âge de glace 3 » .............. 14,90 €",
        "Café Espresso 100 % arabica 3e offert .... 5,50 €",
        "Salades × 2 (promotion) ............... 1,40 €",
        "Démaquillant 10 % Gratuit. ............ 2,20 €",
        "Chocolat × 4 (4e tablette gratuite) ... 3,20 €",
        "Poulet (promotion) ................... 6,40 €",
        "Lot de 2 pots de confiture (TG) ....... 4,30 €",
        "1 litre d'huile de colza ............. 2,80 €",
        "Yaourts nature (× 12) ................ 1,75 €",
        "Yaourt à boire au chocolat le 3e offert 4,40 €",
        "Cadre photo blanc .................... 5,60 €",
        "Savon. ............................... 0,75 €",
        "Pain ................................. 1,80 €",
        "Lot chaussettes enfant × 4 (promotion) 4,80 €",
        "1 paire de chaussettes noires 43. .... 4,50 €",
        "6 tasses à café (TG) ................. 4,80 €",
        "1 jus d'orange ....................... 1,90 €",
        "Pack d'eau ........................... 3,20 €",
        "Beurre doux .......................... 1,50 €",
        "Spaghettis aux œufs frais ............ 0,90 €",
        "MP4 ................................. 49,90 €",
        "Cartouches d'encre imprimante ....... 14,90 €",
        "TOTAL .............................. 141,40 €",
        "Ticket n° 46134 - 15 h 38",
        "Le positif est de retour.",
    ],
    "expected": {
        "total": 141.40,
        "shop": "Carrefour",
        "articles_count": 22,
    },
}

# --- Ticket 5 : format d'origine ALDI/LIDL (ligne de quantité séparée) ------
# Garde-fou anti-régression : c'est la mise en page pour laquelle le parseur
# a été écrit au départ ("LIBELLÉ  PRIX_UNIT" puis "N x PRIX" en dessous).
ALDI = {
    "lines": [
        "ALDI MARCHE",
        "31/12/2023",
        "BOULETTES BOEUF 900G 6,99 € 1",
        "2 x 6,99 €",
        "LAIT DEMI ECREME 0,89 €",
        "TOTAL TTC 14,87 €",
    ],
    "expected": {
        "articles": [
            ("BOULETTES BOEUF 900G", 2, 13.98),
            ("LAIT DEMI ECREME", 1, 0.89),
        ],
        "total": 14.87,
        "shop": "Aldi",
        "date": "2023-12-31",
    },
}

ALL = {
    "receipt_generic": RECEIPT_GENERIC,
    "mykomela": MYKOMELA,
    "berghotel": BERGHOTEL,
    "carrefour": CARREFOUR,
    "aldi": ALDI,
}
