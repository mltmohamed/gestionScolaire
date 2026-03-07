# 🚀 Guide de Démarrage Rapide - SchoolManage

## Installation et Premier Lancement

### 1. Installation des Dépendances

```bash
npm install
```

### 2. Lancement en Mode Développement

```bash
npm run electron:dev
```

Cette commande va :
- Démarrer le serveur de développement Vite (port 5173)
- Lancer automatiquement l'application Electron

### 3. Compiler pour la Production

```bash
npm run electron:build
```

Le fichier exécutable sera créé dans le dossier `dist/`.

---

## 📋 Structure du Projet Complète

```
app_gestion_scolaire/
├── src/
│   ├── main/                              # Main Process Electron
│   │   ├── main.js                        # Point d'entrée principal
│   │   ├── preload.js                     # Bridge sécurisé main/renderer
│   │   ├── ipc-handlers.js                # Gestionnaires IPC (API)
│   │   └── database/
│   │       ├── db.js                      # Configuration sql.js
│   │       └── schema.sql                 # Schéma de la base de données
│   │
│   └── renderer/                          # Renderer Process (React)
│       ├── index.html                     # Point d'entrée HTML
│       └── src/
│           ├── App.jsx                    # Composant principal avec routing
│           ├── main.jsx                   # Point d'entrée React
│           ├── index.css                  # Styles globaux + Tailwind
│           │
│           ├── components/
│           │   ├── ui/                    # Composants shadcn/ui
│           │   │   ├── button.jsx         # Bouton avec variantes
│           │   │   ├── input.jsx          # Champ de formulaire
│           │   │   ├── card.jsx           # Carte et conteneurs
│           │   │   ├── table.jsx          # Tableau de données
│           │   │   ├── dialog.jsx         # Fenêtres modales
│           │   │   └── theme-toggle.jsx   # Bascule dark/light mode
│           │   │
│           │   └── layout/                # Layout de l'application
│           │       ├── AppLayout.jsx      # Layout principal
│           │       ├── Sidebar.jsx        # Barre latérale de navigation
│           │       ├── Header.jsx         # En-tête avec recherche
│           │       └── MainContent.jsx    # Contenu principal
│           │
│           ├── pages/                     # Pages de l'application
│           │   ├── Dashboard.jsx          # Tableau de bord avec stats
│           │   ├── Students.jsx           # Gestion des élèves (CRUD)
│           │   ├── Teachers.jsx           # Gestion des profs (CRUD)
│           │   └── Classes.jsx            # Gestion des classes (CRUD)
│           │
│           ├── hooks/                     # Hooks personnalisés
│           │   ├── useStudents.js         # Hook pour les élèves
│           │   ├── useTeachers.js         # Hook pour les profs
│           │   └── useClasses.js          # Hook pour les classes
│           │
│           ├── services/                  # Services API
│           │   └── api.js                 # Appels IPC vers backend
│           │
│           ├── context/                   # Contextes React
│           │   └── ThemeContext.jsx       # Gestion du thème
│           │
│           └── utils/                     # Utilitaires
│               └── cn.js                  # Utility pour Tailwind
│
├── package.json                           # Dépendances et scripts
├── electron-builder.json                  # Configuration de build
├── vite.config.js                         # Configuration Vite
├── tailwind.config.js                     # Configuration Tailwind
├── postcss.config.js                      # Configuration PostCSS
├── .gitignore                             # Fichiers à ignorer
└── README.md                              # Documentation complète
```

---

## 🎯 Fonctionnalités Implémentées

### ✅ Dashboard
- [x] Statistiques en temps réel (élèves, profs, classes)
- [x] Cartes de statistiques animées
- [x] Tableau des derniers élèves inscrits
- [x] Interface moderne et responsive

### ✅ Gestion des Élèves
- [x] Liste complète avec recherche
- [x] Formulaire d'ajout/modification
- [x] Suppression avec confirmation
- [x] Assignation aux classes
- [x] Gestion du statut (actif/inactif)
- [x] Informations complètes

### ✅ Gestion des Professeurs
- [x] Répertoire des enseignants
- [x] CRUD complet
- [x] Spécialités
- [x] Coordonnées

### ✅ Gestion des Classes
- [x] Création de classes
- [x] Niveaux multiples (6ème à Terminale)
- [x] Assignment professeur principal
- [x] Suivi des effectifs
- [x] Capacité maximale

### ✅ Interface Utilisateur
- [x] Dark/Light mode toggle
- [x] Sidebar de navigation
- [x] Header avec recherche
- [x] Tables modernes
- [x] Formulaires élégants
- [x] Animations fluides
- [x] Responsive design

### ✅ Architecture
- [x] Séparation main/renderer process
- [x] Communication IPC sécurisée
- [x] Base de données SQLite locale
- [x] Code modulaire et maintenable
- [x] Hooks personnalisés
- [x] Components réutilisables

---

## 🗄️ Base de Données

### Tables Créées

**students** (Élèves)
- id, first_name, last_name, date_of_birth, gender
- email, phone, address, class_id
- enrollment_date, status, created_at, updated_at

**teachers** (Professeurs)
- id, first_name, last_name, email, phone
- address, specialty, hire_date, status
- created_at, updated_at

**classes**
- id, name, level, academic_year
- max_students, teacher_id
- created_at, updated_at

**subjects** (Matières)
- id, name, code, description, coefficient
- created_at

**grades** (Notes)
- id, student_id, subject_id, value, max_value
- comment, date, term, created_at

---

## 🎨 Personnalisation

### Changer les Couleurs

Modifiez `src/renderer/src/index.css` :

```css
:root {
  --primary: 221 83% 53%;  /* Bleu électrique */
  --background: 0 0% 98%;
  /* etc. */
}
```

### Ajouter une Page

1. Créez le fichier dans `src/renderer/src/pages/`
2. Ajoutez la route dans `App.jsx`
3. Ajoutez le lien dans `Sidebar.jsx`

### Ajouter un Composant

1. Créez le fichier dans `src/renderer/src/components/ui/`
2. Exportez le composant
3. Importez-le où nécessaire

---

## 🔧 Commandes Disponibles

```bash
# Développement
npm run dev              # Lance Vite seul
npm run electron:dev     # Lance Vite + Electron

# Build
npm run build            # Build Vite seulement
npm run electron:build   # Build complet Electron

# Preview
npm run preview          # Preview du build
```

---

## 🐛 Résolution de Problèmes

### Erreur: "Module not found"
Vérifiez que les imports utilisent les bons chemins :
- `./button` au lieu de `./ui/button` dans le dossier ui
- `@/` alias pour `src/renderer/src/`

### Erreur: "Cannot find module 'sql.js'"
Réinstallez les dépendances :
```bash
rm -rf node_modules package-lock.json
npm install
```

### L'application ne se lance pas
1. Vérifiez que le port 5173 est libre
2. Redémarrez avec `npm run electron:dev`
3. Consultez les erreurs dans la console

### Base de données corrompue
Supprimez `schoolmanage.db` et redémarrez l'application.

---

## 📝 Bonnes Pratiques

### Code
- ✅ Utiliser les hooks personnalisés pour les appels API
- ✅ Gérer les erreurs avec try/catch
- ✅ Valider les formulaires côté frontend et backend
- ✅ Comments uniquement si nécessaire

### UI/UX
- ✅ Utiliser les composants shadcn/ui
- ✅ Maintenir le contraste pour l'accessibilité
- ✅ Tests sur différentes tailles d'écran
- ✅ Animations subtiles et fluides

### Performance
- ✅ Lazy loading des composants
- ✅ Mises à jour optimisées du state
- ✅ Requêtes SQL indexées
- ✅ Sauvegarde automatique BDD

---

## 🎉 Prochaines Étapes

L'application est fonctionnelle ! Vous pouvez maintenant :

1. **Tester toutes les fonctionnalités**
   - Naviguer entre les pages
   - Ajouter/modifier/supprimer des éléments
   - Basculer entre dark/light mode

2. **Personnaliser l'interface**
   - Changer les couleurs
   - Ajouter des icônes
   - Modifier le layout

3. **Ajouter des fonctionnalités**
   - Génération de bulletins
   - Export PDF/CSV
   - Graphiques avancés
   - Système d'utilisateurs

4. **Compiler pour distribution**
   - `npm run electron:build`
   - Tester l'exécutable généré
   - Distribuer aux utilisateurs

---

## 📞 Besoin d'Aide ?

- Consultez le `README.md` pour la documentation complète
- Vérifiez les commentaires dans le code
- Testez chaque fonctionnalité individuellement
- Utilisez les DevTools Electron pour déboguer

**Application prête pour l'utilisation ! 🎓✨**
