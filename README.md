# Back-Office Wheelock (Administration)

## 1. Présentation
Ce projet constitue l'interface d'administration Web de la solution **Wheelock**. Il est destiné aux gestionnaires du parc de stationnement pour superviser l'activité en temps réel.

L'application permet notamment de :
- **Visualiser** l'état des bornes et parkings sur une carte interactive.
- **Analyser** les taux d'occupation via des graphiques et statistiques.
- **Gérer** l'inventaire des équipements (ajout de bornes, modification de statuts).
- **Sécuriser** l'accès aux données via une authentification administrateur.

---

## 2. Architecture du projet
Le Back-Office est une **Single Page Application (SPA)** développée avec **React.js**.
Elle communique avec le serveur (Back-End) via une **API REST** sécurisée pour récupérer les données et effectuer les actions d'administration.

* **Frontend :** React.js (Vite)
* **Langage :** JavaScript (ES6+) / JSX
* **Communication :** Axios (Requêtes HTTP) + Polling (Rafraîchissement automatique)
* **Sécurité :** JWT (JSON Web Tokens) stockés localement

---

## 3. Configuration (.env)
Pour fonctionner, l'application doit savoir où se trouve le serveur Back-End.
Créez un fichier `.env` à la racine du projet (au même niveau que `package.json`) et ajoutez-y la ligne suivante :
```env
# URL de l'API Back-End (FastAPI)
# Pour le développement local :
VITE_API_URL=http://localhost:8000

# Pour la production (exemple) :
# VITE_API_URL=https://api.wheelock.fr
```

**Note :** Si vous changez l'adresse du serveur, il suffit de modifier cette ligne et de relancer le projet.

---

## 4. Lancement du projet
Voici les commandes pour installer et lancer l'application sur votre machine.

### Pré-requis
- **Node.js** (Version 18 ou supérieure recommandée)
- **npm** (Installé automatiquement avec Node.js)

### Installation
Ouvrez un terminal dans le dossier du projet et exécutez :
```bash
npm install
```

### Lancement (Mode Développement)
Pour démarrer l'interface en local :
```bash
npm run dev
```

L'application sera accessible dans votre navigateur à l'adresse : **http://localhost:5173**

---

## 5. Structure des dossiers principaux
Le code source est organisé dans le dossier `/src` :

- **📂 /src/pages** : Contient les vues principales de l'application.
  - `Dashboard.jsx` : Vue d'ensemble (KPIs, Graphiques).
  - `Map.jsx` : Carte interactive des parkings.
  - `BornesList.jsx` : Liste détaillée et filtrable des équipements.
  - `Login.jsx` : Page de connexion sécurisée.
  - `Settings.jsx` : Paramètres et export de données.

- **📂 /src/components** : Éléments d'interface réutilisables (Tableaux, Cartes, Modales).

- **📂 /src/services** : Gestion des appels API vers le serveur (via Axios).

- **📂 /src/context** : Gestion de l'authentification (AuthContext).

- **📂 /src/assets** : Images, logos et fichiers statiques.

---

## 6. Dépendances principales
Les bibliothèques clés utilisées dans ce projet sont :

- **React** : Bibliothèque principale pour l'interface utilisateur.
- **React Router Dom** : Gestion de la navigation entre les pages.
- **Recharts** : Création des graphiques et visualisation de données.
- **Leaflet / React-Leaflet** : Affichage et interaction avec la carte OpenStreetMap.
- **Axios** : Client HTTP pour communiquer avec le Back-End.
- **Lucide-React** : Bibliothèque d'icônes modernes.
- **XLSX** : Génération des fichiers Excel pour l'export des données.

---

## 7. Bonnes pratiques et conseils

- **Géocodage** : L'application interroge le service Nominatim (OpenStreetMap) pour convertir les coordonnées GPS en noms de villes. Veillez à respecter les limites d'utilisation de cette API publique.

- **Sécurité** : Ne jamais commiter le fichier `.env` contenant les clés ou URLs sensibles sur le dépôt Git (il est ignoré par défaut).

---

## 8. Déploiement (Mise en production)
Pour déployer l'application sur un vrai serveur web (Apache, Nginx, ou Docker), il faut générer une version optimisée du code :

1. Lancez la commande de build :
```bash
npm run build
```

2. Un dossier `/dist` sera créé à la racine.

3. Copiez le contenu de ce dossier `/dist` sur votre serveur web.

### Via Docker (Optionnel)
Une configuration Docker est disponible pour déployer le front-end facilement :
```bash
docker compose up -d --build
```

---

**Développé par :** INSA HDF
**Version :** 1.0.0  
**Dernière mise à jour :** Janvier 2026
