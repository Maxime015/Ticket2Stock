"""Catégorisation automatique des articles de ticket.

À partir du libellé normalisé (majuscules, sans accents), on devine une
catégorie de dépense par mots-clés. Sert au tableau de bord (dépenses par
catégorie) et aux budgets par catégorie.

L'ordre de `CATEGORY_RULES` fait la priorité : la première catégorie dont un
mot-clé apparaît dans le libellé gagne (donc « bébé » avant « hygiène » car
« couche » appartient aux deux univers).
"""

# Métadonnées d'affichage (miroir de mobile/lib/categories.ts).
CATEGORY_META = {
    "fruits_legumes": {"label": "Fruits & légumes", "emoji": "🥦", "color": "#22C55E"},
    "viande_poisson": {"label": "Viande & poisson", "emoji": "🥩", "color": "#EF4444"},
    "cremerie":       {"label": "Crémerie",          "emoji": "🧀", "color": "#F59E0B"},
    "boulangerie":    {"label": "Boulangerie",       "emoji": "🥖", "color": "#D97706"},
    "epicerie":       {"label": "Épicerie",          "emoji": "🍝", "color": "#EAB308"},
    "boissons":       {"label": "Boissons",          "emoji": "🥤", "color": "#3B82F6"},
    "surgeles":       {"label": "Surgelés",          "emoji": "🧊", "color": "#06B6D4"},
    "hygiene":        {"label": "Hygiène",           "emoji": "🧴", "color": "#EC4899"},
    "entretien":      {"label": "Entretien",         "emoji": "🧽", "color": "#14B8A6"},
    "bebe":           {"label": "Bébé",              "emoji": "🍼", "color": "#F472B6"},
    "animaux":        {"label": "Animaux",           "emoji": "🐾", "color": "#A16207"},
    "maison":         {"label": "Maison",            "emoji": "🏠", "color": "#8B5CF6"},
    "mode":           {"label": "Mode",              "emoji": "👕", "color": "#6366F1"},
    "loisirs":        {"label": "Loisirs & high-tech", "emoji": "🎬", "color": "#0EA5E9"},
    "autres":         {"label": "Autres",            "emoji": "🛒", "color": "#94A3B8"},
}

# Mots-clés (déjà en MAJUSCULES sans accents, comme les libellés normalisés).
CATEGORY_RULES = [
    ("bebe", (
        "COUCHE", "BIBERON", "BEBE", "PETIT POT", "LINGETTE BEBE", "TETINE",
        "LAIT INFANTILE", "LAIT 2E AGE", "LAIT 1ER AGE",
    )),
    ("animaux", (
        "CROQUETTE", "LITIERE", "CHAT", "CHIEN", "PATEE", "FRISKIES",
        "WHISKAS", "PEDIGREE",
    )),
    ("mode", (
        "PANTALON", "ROBE", "CHAUSSETTE", "TSHIRT", "T SHIRT", "TEE SHIRT",
        "TWEETSHIRT", "SWEAT", "PULL", "VESTE", "JEAN", "CHEMISE", "SHORT",
        "BRACELET", "CHAUSSURE", "BASKET", "MANTEAU", "JUPE", "SLIP",
        "BOXER", "CASQUETTE", "CEINTURE", "COLLANT", "DENIM",
    )),
    ("loisirs", (
        "DVD", "BLU RAY", "CD", "JEU", "JOUET", "LIVRE", "MAGAZINE", "MP3",
        "MP4", "CARTOUCHE", "IMPRIMANTE", "CASQUE", "MANETTE", "CONSOLE",
        "PILE", "AMPOULE", "CADRE PHOTO",
    )),
    ("hygiene", (
        "SAVON", "SHAMPOING", "SHAMPOOING", "DENTIFRICE", "BROSSE A DENT",
        "GEL DOUCHE", "DEODORANT", "DEO ", "PAPIER TOILETTE", "MOUCHOIR",
        "DEMAQUILLANT", "COTON", "RASOIR", "MOUSSE A RASER", "CREME SOLAIRE",
        "PROTEGE", "SERVIETTE HYG", "TAMPON", "MAQUILLAGE", "PARFUM",
    )),
    ("entretien", (
        "LESSIVE", "NETTOYANT", "EPONGE", "SAC POUBELLE", "JAVEL",
        "LIQUIDE VAISSELLE", "ESSUIE TOUT", "SOPALIN", "ADOUCISSANT",
        "DESINFECTANT", "DETACHANT", "SPRAY", "WC ", "MENAGE",
    )),
    ("surgeles", (
        "SURGELE", "GLACE", "GLACON", "PIZZA SURGELEE", "FRITE SURGELEE",
        "POISSON PANE", "NUGGETS",
    )),
    ("cremerie", (
        "LAIT", "YAOURT", "YAHOURT", "FROMAGE", "BEURRE", "CREME", "OEUF",
        "OEUFS", "MARGARINE", "PETIT SUISSE", "EMMENTAL", "CAMEMBERT",
        "COMTE", "MOZZARELLA", "CHEESE", "MILK",
    )),
    ("boulangerie", (
        "PAIN", "BAGUETTE", "CROISSANT", "BRIOCHE", "VIENNOISERIE",
        "PAIN AU CHOCOLAT", "CHOCOLATINE", "TARTINE", "BISCOTTE",
    )),
    ("viande_poisson", (
        "BOEUF", "POULET", "PORC", "JAMBON", "STEAK", "POISSON", "SAUMON",
        "VIANDE", "ESCALOPE", "BOULETTE", "SAUCISSE", "THON", "DINDE",
        "LARDON", "MERGUEZ", "COTE", "FILET", "ROTI", "CREVETTE", "FISH",
        "BEEF", "SCHNITZEL", "CHICKEN", "CRABE", "CABILLAUD", "TRUITE",
    )),
    ("fruits_legumes", (
        "POMME", "BANANE", "TOMATE", "SALADE", "LEGUME", "FRUIT", "CAROTTE",
        "OIGNON", "COURGETTE", "POMME DE TERRE", "PATATE", "POIRE", "ORANGE",
        "FRAISE", "RAISIN", "CONCOMBRE", "POIVRON", "CHAMPIGNON", "AVOCAT",
        "CITRON", "BROCOLI", "EPINARD", "HARICOT", "MELON", "PECHE",
        "ANANAS", "KIWI", "CLEMENTINE", "MANGUE",
    )),
    ("boissons", (
        "EAU", "JUS", "SODA", "COCA", "VIN", "BIERE", "BOISSON", "ESPRESSO",
        "CAFE", "THE ", "SIROP", "LIMONADE", "SCHWEPPES", "PERRIER",
        "ORANGINA", "ICE TEA", "ENERGY", "CHAMPAGNE", "RICARD", "WHISKY",
        "LATTE", "MACCHIATO", "CAPPUCCINO",
    )),
    ("epicerie", (
        "PATE", "RIZ", "FARINE", "SUCRE", "SEL", "HUILE", "CONSERVE",
        "SAUCE", "SPAGHETTI", "CEREALE", "CONFITURE", "CHOCOLAT", "BISCUIT",
        "GATEAU", "BONBON", "CHIPS", "KETCHUP", "MAYONNAISE", "MOUTARDE",
        "VINAIGRE", "MIEL", "NUTELLA", "SEMOULE", "LENTILLE", "COMPOTE",
        "SOUPE", "BOUILLON", "EPICE", "PUREE", "MAIS", "OLIVE",
    )),
    ("maison", (
        "ASSIETTE", "TASSE", "VERRE", "USTENSILE", "POELE", "CASSEROLE",
        "BOUGIE", "VAISSELLE", "RANGEMENT", "OUTIL", "AMPOULE",
    )),
]


def categorize(normalized_label: str) -> str:
    """Renvoie la clé de catégorie d'un libellé normalisé (défaut 'autres')."""
    if not normalized_label:
        return "autres"
    text = f" {normalized_label} "
    for category, keywords in CATEGORY_RULES:
        for keyword in keywords:
            if keyword in text:
                return category
    return "autres"


def category_meta(category: str) -> dict:
    """Métadonnées d'affichage d'une catégorie (label, emoji, couleur)."""
    meta = CATEGORY_META.get(category) or CATEGORY_META["autres"]
    return {"category": category, **meta}
