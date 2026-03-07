# SchoolManage - Application de Gestion Scolaire

Une application desktop moderne et professionnelle pour la gestion des établissements scolaires, développée avec Electron, React et SQLite.

## 🎯 Fonctionnalités

### Dashboard
- Vue d'ensemble avec statistiques en temps réel
- Nombre d'élèves, professeurs et classes
- Élèves récemment inscrits
- Interface moderne inspirée de Notion/Stripe/Linear

### Gestion des Élèves
- ✅ Ajouter, modifier, supprimer des élèves
- ✅ Recherche rapide par nom/prénom
- ✅ Assignation aux classes
- ✅ Suivi du statut (actif/inactif)
- ✅ Informations complètes (coordonnées, date de naissance, etc.)

### Gestion des Professeurs
- ✅ Répertoire des enseignants
- ✅ Spécialités et coordonnées
- ✅ Statut des professeurs

### Gestion des Classes
- ✅ Création et gestion des classes
- ✅ Assignment des professeurs principaux
- ✅ Suivi des effectifs
- ✅ Niveaux multiples (6ème à Terminale)

## 🛠️ Technologies Utilisées

### Backend (Main Process)
- **Electron** - Framework d'application desktop
- **sql.js** - Base de données SQLite en mémoire
- **IPC** - Communication sécurisée entre processus

### Frontend (Renderer Process)
- **React 18** - Bibliothèque UI
- **React Router** - Navigation
- **TailwindCSS** - Styles modernes
- **shadcn/ui** - Composants UI élégants
- **Lucide Icons** - Icônes modernes
- **Radix UI** - Primitives accessibles

## 📁 Structure du Projet

```
app_gestion_scolaire/
├── src/
│   ├── main/                    # Main Process Electron
│   │   ├── main.js              # Point d'entrée principal
│   │   ├── preload.js           # Bridge sécurisé
│   │   ├── ipc-handlers.js      # Gestionnaires IPC
│   │   └── database/
│   │       ├── db.js            # Configuration SQLite
│   │       └── schema.sql       # Schéma BDD
│   │
│   └── renderer/                # Renderer Process (React)
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/          # Composants shadcn
│       │   │   └── layout/      # Layout (Sidebar, Header)
│       │   ├── pages/           # Pages (Dashboard, Students...)
│       │   ├── hooks/           # Hooks personnalisés
│       │   ├── services/        # API services
│       │   ├── context/         # Contextes (Theme)
│       │   └── utils/           # Utilitaires
│       │
│       └── public/
│
├── package.json
├── electron-builder.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🚀 Installation et Démarrage

### Prérequis
- Node.js >= 18.x
- npm ou yarn

### Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Lancer en mode développement**
```bash
npm run electron:dev
```

3. **Compiler pour la production**
```bash
npm run electron:build
```

L'application sera disponible dans le dossier `dist/`.

## 🎨 Design et Interface

### Thèmes
- **Dark Mode** et **Light Mode**
- Bascule via le bouton dans le header
- Préférence sauvegardée localement

### Palette de Couleurs
- Primaire : Bleu électrique (#0066FF)
- Fond clair : Blanc cassé (#FAFAFA)
- Fond sombre : Gris très foncé (#0A0A0A)

### Composants Modernes
- Sidebar de navigation responsive
- Cartes de statistiques animées
- Tableaux de données élégants
- Formulaires avec validation
- Dialogues/modales pour CRUD
- Notifications visuelles

## 💾 Base de Données

### Tables Principales

**students** - Élèves
- Informations personnelles
- Assignation aux classes
- Historique scolaire

**teachers** - Professeurs
- Coordonnées
- Spécialités
- Statut

**classes** - Classes
- Nom et niveau
- Professeur principal
- Capacité maximale

**subjects** - Matières
- Nom et code
- Coefficient

**grades** - Notes
- Évaluations par élève
- Commentaires
- Trimestres

## 🔒 Sécurité

- **contextBridge** pour une communication IPC sécurisée
- **nodeIntegration** désactivé
- **contextIsolation** activé
- Validation des données côté backend
- Pas d'accès direct au système de fichiers

## 📱 Responsive Design

L'application s'adapte à différentes tailles d'écran :
- Fenêtre redimensionnable
- Sidebar fixe
- Contenu scrollable indépendamment
- Tableaux adaptatifs

## 🧪 Tests et Validation

Fonctionnalités testées :
- ✅ CRUD complet sur toutes les entités
- ✅ Recherche et filtres
- ✅ Navigation entre pages
- ✅ Dark/Light mode toggle
- ✅ Affichage des statistiques
- ✅ Relations entre tables (classes/élèves/profs)

## 📦 Distribution

### Plateformes Supportées
- Windows (NSIS installer)
- macOS (DMG)
- Linux (AppImage)

### Commandes de Build
```bash
# Build pour Windows
npm run electron:build

# Le fichier exécutable sera dans dist/
```

## 🔮 Fonctionnalités Futures (Optionnelles)

- Génération de bulletins scolaires
- Export PDF des listes
- Import/export CSV
- Statistiques avancées avec graphiques
- Système d'utilisateurs multi-profils
- Sauvegarde cloud automatique
- Notifications push
- Emploi du temps

## 👨‍💻 Développement

### Architecture Propre

**Main Process** gère :
- Fenêtre Electron
- Base de données
- Operations système
- IPC handlers

**Renderer Process** gère :
- Interface utilisateur
- Routing
- State management
- Appels API via IPC

### Bonnes Pratiques

- Code modulaire et maintenable
- Composants réutilisables
- Hooks personnalisés
- Séparation des responsabilités
- Comments uniquement si nécessaire

## 📄 License

MIT License - Libre utilisation et modification

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Reporter des bugs
- Suggérer des améliorations
- Proposer des pull requests

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue GitHub
- Consultez la documentation
- Vérifiez les issues existantes

---

**Développé avec ❤️ par Votre Équipe**

*Application moderne de gestion scolaire*
