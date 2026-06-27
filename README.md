# SchoolManage

Application desktop de gestion scolaire construite avec Electron, React, Vite et une base locale SQLite via `sql.js`.

## Fonctionnalites

- Authentification administrateur
- Gestion des eleves, professeurs et classes
- Suivi des paiements de scolarite, tenues et salaires
- Bulletins scolaires
- Import/export des donnees
- Theme clair/sombre

## Stack

- Electron
- React + Vite
- Tailwind CSS
- SQLite via `sql.js`

## Installation

```bash
npm install
```

## Lancement en developpement

```bash
npm run electron:dev
```

Identifiants par defaut :

```text
Utilisateur : admin
Mot de passe : admin
```

## Build

```bash
npm run electron:build
```

Les fichiers generes sont places dans `release/`.

## Structure

```text
src/
  main/       Processus Electron, IPC et base de donnees
  renderer/   Interface React
public/       Assets publics
```

## Notes

Les donnees sont stockees localement dans le dossier `userData` de l'application.
