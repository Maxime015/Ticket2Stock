# 🐍 Ticket2Stock — Backend (API Flask)

API REST du projet [Ticket2Stock](../README.md) : authentification JWT, extraction de tickets
de caisse (Gemini / OCR), gestion du stock, liste de courses, statistiques et budgets,
le tout sur **PostgreSQL** (Neon).

---

## 🛠 Stack

- **Framework :** Flask 3 (blueprints : `auth`, `tickets`, `stock`, `shopping`, `stats`, `budgets`)
- **Base de données :** PostgreSQL via `psycopg2` — schéma créé/migré automatiquement au démarrage (`ADD COLUMN IF NOT EXISTS`)
- **Sécurité :** JWT (`PyJWT`), BCrypt, Flask-CORS, rate-limiting sur `/login` (Flask-Limiter)
- **Extraction :** Gemini (vision LLM) → OCR.space (API) → EasyOCR (local), voir [pipeline](#-pipeline-dextraction)

---

## 🚀 Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows : venv\Scripts\activate
pip install -r requirements.txt
```

### ⚙️ Configuration

Créez un fichier **`.env`** à la racine de `backend/` :

```bash
# --- Application ---
PORT=8080
NODE_ENV=development
JWT_SECRET=votre_cle_secrete_ici

# --- Database (Neon PostgreSQL) ---
DATABASE_URL=postgresql://utilisateur:mot_de_passe@host/neondb?sslmode=require

# --- Gemini (extraction prioritaire, vision LLM) ---
GEMINI_API_KEY=votre_cle_google_ai_studio
# Optionnel : GEMINI_MODEL=gemini-2.0-flash

# --- OCR.space (moteur OCR de secours, puis EasyOCR en local) ---
OCR_API_KEY=votre_cle_ocr_space
```

> Si `GEMINI_API_KEY` est absente, le pipeline bascule automatiquement sur OCR.space puis EasyOCR.

### ▶️ Lancement

```bash
python app.py                     # écoute sur :8080, crée/migre les tables au démarrage
```

---

## 🧠 Pipeline d'extraction

```text
Image du ticket (base64)
  1. Gemini (vision LLM)  → JSON structuré direct (enseigne, articles catégorisés, totaux)   [si GEMINI_API_KEY]
  2. OCR.space (API)      → texte → receipt_parser (regex FR)                                [repli]
  3. EasyOCR (local)      → texte → receipt_parser (regex FR)                                [repli hors-ligne API]
```

- Le moteur retenu est renvoyé dans le champ `ocr_engine` de la réponse.
- `receipt_parser.py` extrait enseigne, date, articles, quantités, prix unitaire/total,
  totaux HT/TVA/TTC — formats FR/EN/DE, poids (kg), pointillés, colonnes.
- `categories.py` classe chaque article dans l'une des **15 catégories** par mots-clés
  (fruits & légumes, viande, crémerie, hygiène, mode…).

### 🧪 Tests (sans dépendance externe)

```bash
./venv/bin/python tests/run_parser_tests.py   # 5 formats de tickets réels
./venv/bin/python tests/run_gemini_tests.py   # normalisation de la sortie Gemini (hors-ligne)
```

---

## 📁 Structure

```text
backend/
├── app.py                        # Point d'entrée, blueprints, gestion d'erreurs
├── requirements.txt
├── vercel.json / runtime.txt     # Déploiement Vercel (@vercel/python, Python 3.10)
├── config/
│   ├── db.py                     # Connexion + schéma/migrations PostgreSQL
│   └── env.py                    # Variables d'environnement
├── controllers/
│   ├── auth_controller.py        # Inscription / connexion / effacement des données
│   ├── ticket_controller.py      # Scan, sauvegarde, historique, détail
│   ├── stock_controller.py       # CRUD du stock (catégorie, péremption)
│   ├── shopping_controller.py    # Liste de courses
│   ├── stats_controller.py       # Tableau de bord + export CSV
│   └── budgets_controller.py     # Budgets mensuels
├── middlewares/
│   └── auth_middleware.py        # Protection JWT des routes
├── modules/
│   ├── categories.py             # Catégorisation par mots-clés (15 catégories)
│   └── ocr/
│       ├── pipeline.py           # Orchestration Gemini → OCR.space → EasyOCR
│       ├── gemini_engine.py      # Extraction structurée via Gemini (vision LLM)
│       ├── ocr_space.py          # Client API OCR.space
│       ├── easyocr_engine.py     # Fallback OCR local
│       ├── layout.py             # Reconstruction des lignes (mots positionnés)
│       └── receipt_parser.py     # Parseur de tickets (OCR → JSON) + catégorisation
├── routes/                       # Blueprints (auth, tickets, stock, shopping, stats, budgets)
└── tests/                        # Runners sans dépendance (parser + gemini)
```

---

## 🗄️ Schéma de base de données

`users` · `tickets` · `ticket_items` (+ `category`) · `stock_items` (+ `category`, `expiry_date`) ·
`shopping_list_items` · `budgets` (global si `category = ''`, sinon par catégorie).

---

## 🔐 API Endpoints

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| POST | `/api/auth/register` | Création de compte | Public |
| POST | `/api/auth/login` | Connexion JWT (rate-limité) | Public |
| DELETE | `/api/auth/data` | Efface toutes les données de l'utilisateur (compte conservé) | 🔒 JWT |
| POST | `/api/tickets/scan` | Extraction d'un ticket (Gemini/OCR, sans persistance) | 🔒 JWT |
| POST | `/api/tickets` | Enregistre le ticket validé + met à jour le stock | 🔒 JWT |
| GET | `/api/tickets` | Historique des tickets | 🔒 JWT |
| GET | `/api/tickets/:id` | Détail d'un ticket (articles) | 🔒 JWT |
| DELETE | `/api/tickets/:id` | Supprime un ticket | 🔒 JWT |
| GET | `/api/stock` | Stock courant (catégorie, péremption) | 🔒 JWT |
| POST | `/api/stock` | Ajout manuel d'un article | 🔒 JWT |
| PATCH | `/api/stock/:id` | Quantité / seuil / libellé / catégorie / péremption | 🔒 JWT |
| DELETE | `/api/stock/:id` | Retire un article du stock | 🔒 JWT |
| GET | `/api/shopping` | Liste de courses | 🔒 JWT |
| POST | `/api/shopping` | Ajout manuel à la liste | 🔒 JWT |
| POST | `/api/shopping/generate` | Génère la liste depuis le stock bas | 🔒 JWT |
| PATCH | `/api/shopping/:id/toggle` | Coche / décoche un élément | 🔒 JWT |
| DELETE | `/api/shopping/:id` | Supprime un élément | 🔒 JWT |
| DELETE | `/api/shopping/clear-checked` | Vide les éléments cochés | 🔒 JWT |
| GET | `/api/stats/overview` | Dépenses du mois, évolution, catégories, top produits/enseignes, budgets | 🔒 JWT |
| GET | `/api/stats/export` | Export CSV de toutes les dépenses (séparateur `;` + BOM UTF-8) | 🔒 JWT |
| GET | `/api/budgets` | Budgets mensuels (global + par catégorie) | 🔒 JWT |
| PUT | `/api/budgets` | Définit/ajuste un budget (montant ≤ 0 = suppression) | 🔒 JWT |
| GET | `/health` | Statut du serveur | Public |
