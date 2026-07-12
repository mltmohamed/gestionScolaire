# La Sagesse — Gestion scolaire

La Sagesse est une application de bureau conçue pour simplifier la gestion quotidienne d’une école, du jardin d’enfants à la 9e année.

Elle fonctionne principalement sur Windows et conserve les données sur l’ordinateur où elle est utilisée. Aucun serveur en ligne n’est nécessaire.

## Ce que l’application permet de faire

- gérer les élèves, leurs photos, leurs parents et leurs tuteurs ;
- gérer les professeurs, leurs spécialités et leurs salaires ;
- créer les classes avec leur année scolaire, leur capacité et leurs frais ;
- enregistrer les paiements de scolarité et les ventes de tenues ;
- suivre et imprimer les paiements des enseignants ;
- préparer les bulletins du jardin à la 9e année ;
- créer et imprimer les cartes scolaires ;
- consulter un tableau de bord avec les principaux chiffres de l’école ;
- sauvegarder et restaurer les données scolaires.

## Installer l’application sur Windows

Deux versions sont disponibles dans le dossier `release`.

### Installation classique — recommandée

1. Ouvrez le fichier `la sagesse-Setup-1.0.0-x64.exe`.
2. Suivez les étapes affichées à l’écran.
3. Choisissez le dossier d’installation si nécessaire.
4. Lancez ensuite **La Sagesse** depuis le Bureau ou le menu Démarrer.

### Version portable

Ouvrez directement `la sagesse-Portable-1.0.0-x64.exe`. Cette version fonctionne sans installation et peut être placée dans le dossier de votre choix.

> Windows peut afficher un avertissement parce que l’application n’est pas signée numériquement. Ne continuez que si le fichier provient d’une source de confiance.

## Première connexion

Lors de la toute première installation, utilisez :

- **Identifiant :** `admin`
- **Mot de passe :** `admin`

Après la connexion, ouvrez **Paramètres > Sécurité** et remplacez immédiatement ce mot de passe. Le nouveau mot de passe doit contenir au moins 6 caractères.

Le mot de passe `admin` n’est pas recréé si un compte administrateur existe déjà.

## Bien démarrer

Pour préparer correctement l’application, suivez cet ordre :

1. Ajoutez les professeurs.
2. Créez les classes avec la bonne année scolaire, les frais et la capacité.
3. Inscrivez les élèves et affectez-les à leurs classes.
4. Vérifiez les informations des élèves avant d’imprimer leurs cartes scolaires.
5. Enregistrez les paiements et préparez les bulletins.
6. Exportez régulièrement une sauvegarde.

## Les principaux menus

| Menu | Utilité |
| --- | --- |
| **Tableau de bord** | Voir les effectifs, les paiements, les classes et les activités récentes. |
| **Élèves** | Ajouter, rechercher, modifier, désactiver ou consulter un élève. |
| **Professeurs** | Gérer les coordonnées, spécialités, salaires et statuts des professeurs. |
| **Classes** | Définir l’année scolaire, les enseignants, la capacité et les différents frais. |
| **Cartes scolaires** | Imprimer la carte d’un élève ou toutes les cartes d’une classe. |
| **Paiements > Scolarité** | Suivre les échéances, paiements partiels, montants payés et restes. |
| **Paiements > Tenues** | Enregistrer les ventes de tenues de classe ou de sport et imprimer les reçus. |
| **Paiements > Enseignants** | Enregistrer les salaires et imprimer les reçus ou rapports mensuels. |
| **Bulletins > Jardin–2e** | Saisir les notes sur 10, absences, retards, appréciations et rangs. |
| **Bulletins > 3e–6e** | Préparer les compositions mensuelles et imprimer les bulletins de la classe. |
| **Bulletins > 7e–9e** | Saisir les notes de classe et de composition sur 20, coefficients et décisions. |
| **Paramètres** | Modifier le profil, le thème, le mot de passe et gérer les sauvegardes. |

## Sauvegarder les données

1. Ouvrez **Paramètres > Données**.
2. Cliquez sur **Exporter les données**.
3. Choisissez un emplacement facile à retrouver.
4. Copiez le fichier de sauvegarde sur une clé USB, un disque externe ou un autre ordinateur.

Les données restent sur l’ordinateur : elles ne sont pas sauvegardées automatiquement sur Internet.

### Ce qui est inclus

La sauvegarde contient :

- les élèves, professeurs et classes ;
- les paiements, notes et bulletins ;
- les comptes utilisateurs et leurs mots de passe protégés ;
- le profil administrateur et sa photo ;
- les préférences de thème et de langue.

> Le fichier contient des données personnelles et les informations nécessaires pour restaurer les comptes. Conservez-le dans un emplacement sécurisé et ne le transmettez pas à une personne non autorisée.

## Restaurer une sauvegarde

> **Attention : l’importation remplace les données scolaires actuellement présentes dans l’application.**

1. Exportez d’abord une copie des données actuelles.
2. Ouvrez **Paramètres > Données**.
3. Cliquez sur **Importer une sauvegarde**.
4. Sélectionnez uniquement un fichier créé par cette application.
5. Confirmez l’opération.
6. Après la restauration, l’application se recharge et demande une nouvelle connexion.

Ne modifiez pas manuellement le contenu du fichier de sauvegarde.

Avant de remplacer les données, l’application vérifie la version, la présence de toutes les tables, les comptes, les compteurs et les relations entre les données. Un fichier incomplet, incohérent ou non reconnu est refusé sans modifier les données actuelles.

### Anciennes sauvegardes

Les sauvegardes créées avec l’ancien format restent acceptées si elles sont complètes. Elles restaurent les données scolaires, mais conservent les comptes, le profil et les préférences déjà présents sur l’ordinateur.

## Conseils importants

- Vérifiez toujours l’année scolaire enregistrée sur chaque classe.
- Faites une sauvegarde au moins une fois par semaine et avant toute mise à jour.
- Conservez au moins une copie de la sauvegarde en dehors de l’ordinateur principal.
- Protégez le fichier de sauvegarde comme un document confidentiel.
- Protégez le mot de passe administrateur et ne le partagez qu’avec les responsables autorisés.
- Utilisez les boutons **Désactiver** lorsque vous souhaitez conserver l’historique d’un élève ou d’un professeur.

## En cas de difficulté

- **Connexion impossible :** vérifiez l’identifiant et le mot de passe. `admin` / `admin` fonctionne uniquement lors de la première installation ou après une réinitialisation volontaire.
- **Après une restauration :** utilisez l’identifiant et le mot de passe qui existaient au moment de la sauvegarde.
- **Une impression ne démarre pas :** vérifiez qu’une imprimante est disponible et que la classe ou l’élève est bien sélectionné.
- **L’application ne démarre plus :** ne supprimez aucun fichier de données ; contactez la personne chargée de la maintenance.

## Pour les développeurs

Cette partie n’est pas nécessaire pour utiliser l’application installée.

### Prérequis

- Node.js 20 ou une version plus récente ;
- npm ;
- une connexion Internet lors de la première installation des dépendances.

### Installer les dépendances

```bash
npm install
```

### Lancer l’application en développement

```bash
npm run electron:dev
```

### Créer les versions installable et portable

```bash
npm run electron:build
```

Les fichiers générés sont placés dans le dossier `release`.

L’application utilise Electron, React, Vite, Tailwind CSS et une base de données locale SQLite avec `sql.js`.
