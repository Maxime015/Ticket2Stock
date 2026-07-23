# 📱 Ticket2Stock — Mobile (Expo / React Native)

Application mobile du projet [Ticket2Stock](../README.md) : scan de tickets de caisse,
stock, liste de courses, statistiques et budgets — consommant l'[API Flask](../backend/README.md).

---

## 🛠 Stack

- **Framework :** Expo SDK 54 (React Native 0.81) + **TypeScript**
- **Navigation :** Expo Router (Stack + onglets natifs `NativeTabs` + modal de revue)
- **UI :** NativeWind (Tailwind CSS) — design system violet, cartes arrondies, thème clair/sombre via variables CSS
- **Animations :** React Native Reanimated + `Animated` (marquee) + retours haptiques (`expo-haptics`)
- **State :** Zustand (auth + résultat de scan)
- **Média / natif :** `expo-camera`, `expo-image-picker`, `expo-image-manipulator`, `expo-notifications`, `expo-sharing`, `expo-file-system`
- **Persistance locale :** AsyncStorage (session + cache de lecture hors-ligne)

---

## 🚀 Lancement

```bash
cd mobile
npm install
npx expo start                    # puis scannez le QR code avec Expo Go
```

Autres commandes : `npm run ios`, `npm run android`, `npm run lint`.

> ⚠️ Le backend doit tourner (voir le [README backend](../backend/README.md)) :
> `cd backend && python app.py` — l'API écoute sur le port **8080**.

### 🔌 Connexion à l'API

- **En développement**, l'app détecte automatiquement l'IP de la machine qui sert le bundle
  Expo (via `expo-constants`) pour joindre l'API sur le port 8080 — aucune config à changer
  pour tester sur un téléphone physique.
- **En production**, elle pointe vers l'URL déployée.
- Le tout est centralisé dans [`constants/api.js`](./constants/api.js).

> 📷 Certaines fonctionnalités natives (caméra, notifications) se testent au mieux sur un
> **appareil réel**. La caméra n'est pas disponible sur simulateur — utilisez
> « Importer depuis la galerie ».

---

## 🧭 Écrans

| Écran | Rôle |
|-------|------|
| `(auth)/` | Connexion / inscription — marquee animé de tuiles emoji |
| `(tabs)/` Scanner | Capture caméra ou import galerie, compression puis envoi au scan |
| `ticket-review` | Revue du scan avant enregistrement (édition quantités, suppression d'articles) |
| `(tabs)/` Stock | Stock courant par catégorie, compteur +/-, seuils, péremption (« à consommer bientôt ») |
| `(tabs)/` Courses | Liste de courses générée depuis le stock bas + gestion manuelle |
| `(tabs)/` Stats | Dépenses du mois, évolution 6 mois, répartition par catégorie, top produits / enseignes, budgets |
| `budgets` | Édition des budgets mensuels (global + par catégorie) |
| `ticket/[id]` | Détail d'un ticket (articles, totaux) |
| `(tabs)/` Profil | Avatar automatique, thème, export CSV, effacement des données |

---

## 📁 Structure

```text
mobile/
├── app/
│   ├── (auth)/                   # Connexion / Inscription (marquee animé)
│   ├── (tabs)/                   # Scanner, Stock, Courses, Stats, Profil
│   ├── budgets.tsx               # Édition des budgets mensuels
│   ├── ticket-review.tsx         # Revue du scan avant enregistrement
│   └── ticket/[id].tsx           # Détail d'un ticket
├── components/ui/                # Button, Card, Chip, Stepper, DeleteButton, TileMarquee…
├── services/                     # Appels API typés (tickets, stock, shopping, stats, budgets, export, account)
├── lib/                          # client (JWT), cache (hors-ligne), categories, notifications, theme
├── store/                        # Zustand (auth, scan)
├── constants/api.js              # URL de l'API (auto-détection de l'IP en dev)
└── tailwind.config.js            # Design system NativeWind
```

---

## 📶 Cache hors-ligne (lecture)

Les écrans Stock, Courses et Stats passent par `fetchWithCache` (`lib/cache`) : chaque réponse
API est mise en cache dans AsyncStorage et resservie telle quelle quand le réseau est
indisponible — consultation seule, les écritures nécessitent une connexion.

## 🔔 Notifications locales

`lib/notifications` programme des notifications **locales** (`expo-notifications`) :
rappels de péremption (J-2 et jour J) et alertes budget (90 % / 100 %). Aucune
infrastructure push n'est requise.
