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
* **Sécurité :** JWT (JSON Web Tokens) stockés localement

---

## 3. Configuration (.env)
Par défaut, l'application est pré-configurée pour fonctionner en local sur le port 8000.

Cependant, si vous souhaitez changer l'adresse du serveur (ex: pour la mise en production), vous pouvez surcharger la configuration par défaut :

1. Créez un fichier nommé `.env` à la racine du projet.
2. Ajoutez la variable `VITE_API_URL` avec votre adresse :

```env
VITE_API_URL=http://votre-adresse-ip:8000
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

- **📂 /src/components** : Éléments d'interface réutilisables.

- **📂 /src/services** : Gestion des appels API vers le serveur (via Axios).

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

**Développé par :** INSA HDF
**Version :** 1.0.0  
**Dernière mise à jour :** Janvier 2026
