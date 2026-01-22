<div align="center">

<img src="./mobile/assets/images/logo.png" width="600" height="300" style="display: block; margin: 0 auto"/>

# 🧾 Ticket2Stock  
### Application intelligente de scan de tickets & OCR

<p align="center">
  <strong>Ticket2Stock</strong> est une application mobile intelligente permettant de scanner des tickets de caisse
  grâce à la technologie <strong>OCR</strong> (Reconnaissance Optique de Caractères).  
  Elle extrait automatiquement les informations clés (magasin, articles, prix)
  et les stocke pour une consultation ultérieure.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  <img src="https://img.shields.io/badge/Frontend-Expo-blue" />
  <img src="https://img.shields.io/badge/Backend-Flask-green" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-red" />
</p>

<p align="center">
  <strong>
    <a href="#-fonctionnalités">Fonctionnalités</a> •
    <a href="#️-architecture-technique">Architecture</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-api-endpoints">API</a> •
    <a href="#-structure-du-projet">Structure</a>
  </strong>
</p>

</div>

---
## 📸 Screenshots

<div style="display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;">

  <img src="./mobile/assets/images/screenshots/a.png" style="width: 32%; margin-bottom: 10px;" />
  <img src="./mobile/assets/images/screenshots/b.png" style="width: 32%; margin-bottom: 10px;" />
  <img src="./mobile/assets/images/screenshots/c.png" style="width: 32%; margin-bottom: 10px;" />

</div>

---

## 🚀 Fonctionnalités

| Catégorie | Description |
|---------|-------------|
| 🔐 **Authentification** | Inscription et connexion sécurisées via **JWT** |
| 📷 **Scan de tickets** | Capture via caméra ou import depuis la galerie |
| 🧠 **OCR intelligent** | Extraction automatique des données (EasyOCR + PyTorch) |
| 🗂️ **Historique** | Sauvegarde et consultation des tickets scannés |
| 👤 **Profil utilisateur** | Gestion du compte avec avatar automatique |
| 🔗 **API REST** | Backend Flask performant avec PostgreSQL |

---

## 🏗️ Architecture Technique

### 📱 Frontend — React Native / Expo
- **Framework :** Expo SDK (React Native)
- **Navigation :** Expo Router (Stacks & Tabs)
- **State Management :** Zustand
- **UI & Animations :** Moti
- **Stockage local :** AsyncStorage
- **Fonctionnalités natives :** Camera & Image Picker (Expo)

### 🐍 Backend — Flask / Python
- **Framework :** Flask
- **Base de données :** PostgreSQL (psycopg2)
- **Sécurité :** JWT, BCrypt, Flask-CORS
- **Performance :** Rate Limiting (Flask-Limiter)
- **OCR :** EasyOCR 

---

## 📁 Structure du Projet

```text
project/
├── backend/                  # API Flask & Logique métier
│   ├── app.py                # Point d'entrée de l'application
│   ├── auth_middleware.py    # Protection des routes (JWT)
│   ├── auth_routes.py        # Définition des endpoints auth
│   ├── auth_controller.py    # Logique d'authentification
│   ├── db.py                 # Connexion PostgreSQL
│   ├── OcrModule.py          # Moteur d'extraction OCR
│   ├── requirements.txt      # Dépendances Python
│   └── config/               # Fichiers de configuration
│
└── frontend/                 # Application Mobile Expo
    ├── app/
    │   ├── (auth)/           # Stack d'authentification (Login/Signup)
    │   └── (tabs)/           # Navigation principale (Scan/Profil)
    ├── store/                # Gestion d'état global (Zustand)
    ├── services/             # Appels API (Axios/Fetch)
    ├── components/           # Composants UI réutilisables
    └── constants/            # Thèmes, Couleurs, Config API
```

---

## 🔧 Installation

### 📌 Prérequis
- Node.js ≥ 18  
- Python ≥ 3.9  
- PostgreSQL ≥ 14  
- Expo CLI  
- Git  

---

### 🐍 Backend

```bash
git clone <repository-url>
cd project/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

---

### 📱 Frontend

```bash
cd project/frontend
npm install
npx expo start
```

---

## ⚙️ Configuration environnementale

#### Pour configurer le projet, créez un fichier `.env` à la racine du dossier `backend/` en vous basant sur le modèle ci-dessous :

```bash
# --- Application ---
PORT=8080
NODE_ENV=development
JWT_SECRET=votre_cle_secrete_ici

# --- Database (PostgreSQL) ---
DATABASE_URL=postgresql://utilisateur:mot_de_passe@host:port/nom_db?sslmode=require

# --- Redis (Upstash) ---
UPSTASH_REDIS_REST_URL="[https://votre-instance.upstash.io](https://votre-instance.upstash.io)"
UPSTASH_REDIS_REST_TOKEN="votre_token_ici"

# --- Security (Arcjet) ---
ARCJET_KEY=votre_cle_arcjet_ici
ARCJET_ENV=development
```
---

## 🔐 API Endpoints

| Méthode | Endpoint | Description | Accès |
|-------|----------|-------------|-------|
| POST | `/api/auth/register` | Création de compte | Public |
| POST | `/api/auth/login` | Connexion JWT | Public |
| POST | `/scan` | OCR Ticket | Public |
| GET | `/health` | Status serveur | Public |

---

## 📜 Licence

Ce projet est sous licence **MIT**.
