# 🧾 OCR Ticket Scanner API

Backend **Flask** pour extraire automatiquement les informations de tickets de caisse via OCR (EasyOCR).  
Reçoit une image en Base64, analyse le texte et retourne les données structurées en **JSON**.

---

## ✨ Fonctionnalités

### 🔒 Authentification
- ✅ Inscription / Connexion utilisateur avec **JWT**
- ✅ Protection des routes avec middleware
- ✅ Limitation du nombre de tentatives de connexion (**rate limiting**)
- ✅ Hachage sécurisé des mots de passe (**bcrypt**)
- ✅ Base de données **PostgreSQL**
- ✅ **CORS** activé

### 🧾 OCR Ticket Scanner
- 📄 Lecture OCR via **EasyOCR**
- 🔍 Extraction automatique des informations :
  - Nom du magasin
  - Adresse
  - Numéro de téléphone
  - SIRET
  - Date
  - Articles (nom + prix)
- 🔄 Retour des données en **JSON structuré**
- 🌐 API REST simple accessible via `/scan`

---

## 🚀 Installation

```bash
# Cloner le projet
git clone <repo>
cd <projet>

# Créer et activer l'environnement virtuel
python -m venv venv
source venv/bin/activate      # Linux/Mac
venv\Scripts\activate         # Windows

# Installer les dépendances
pip install -r requirements.txt
```

### ▶️ Lancement
```bash
python app.py
```
Le serveur est démarré sur : `http://0.0.0.0:8080`

---

## 📡 Utilisation de l'API

### Endpoints

| Méthode | Endpoint              | Description                        |
|---------|---------------------|------------------------------------|
| POST    | /api/auth/register   | Inscription utilisateur           |
| POST    | /api/auth/login      | Connexion utilisateur             |
| POST    | /scan                | Analyse de ticket OCR (auth req.) |

### Scan Ticket (`/scan`)

**Corps JSON :**
```json
{
  "base64String": "<image_base64>"
}
```

**Réponse :**
```json
{
  "shop": {
    "name": "",
    "address": "",
    "nb_article": "",
    "date": "",
    "phone": "",
    "siret": ""
  },
  "articles": [
    {"name": "", "price": ""}
  ]
}
```

---

## 🛠 Stack Technique
- **Backend** : Python 3, Flask, Flask-CORS  
- **OCR** : EasyOCR, OpenCV, PyTorch  
- **Base de données** : PostgreSQL, psycopg2  
- **Sécurité** : JWT, bcrypt, rate limiting  
- **Déploiement** : Compatible **Vercel**

---

## 📁 Structure du projet

```
app.py                 # API Flask principale
config/                # Configuration
routes/                # Routes API
controllers/           # Logique métier
middlewares/           # Middlewares auth
modules/OcrModule.py   # Module OCR
requirements.txt       # Dépendances
```