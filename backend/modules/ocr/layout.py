"""Reconstruction des lignes de lecture à partir de mots positionnés.

Les moteurs OCR renvoient des mots (ou blocs) avec leurs coordonnées.
Sur un ticket, le libellé (à gauche) et le prix (à droite) appartiennent
à la même rangée physique : on regroupe donc par centre vertical, puis
on trie chaque rangée de gauche à droite.
"""


def group_words_into_lines(words: list[dict]) -> list[str]:
    """Regroupe des mots {x, y_center, height, text} en lignes de texte.

    Deux mots appartiennent à la même ligne si leurs centres verticaux
    sont distants de moins de la moitié de la hauteur moyenne des mots.
    """
    words = [w for w in words if w.get("text")]
    if not words:
        return []

    words.sort(key=lambda w: w["y_center"])
    avg_height = sum(w["height"] for w in words) / len(words)
    tolerance = max(avg_height / 2, 6)

    rows = []
    current = [words[0]]
    for word in words[1:]:
        if word["y_center"] - current[-1]["y_center"] <= tolerance:
            current.append(word)
        else:
            rows.append(current)
            current = [word]
    rows.append(current)

    return [
        " ".join(w["text"] for w in sorted(row, key=lambda w: w["x"]))
        for row in rows
    ]
