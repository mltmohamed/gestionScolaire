# 📚 Guide d'Installation - SchoolManage

## 🎯 Présentation

**SchoolManage** est une application de gestion scolaire complète fonctionnant sur Windows. Elle permet de gérer :
- 👨‍🎓 Élèves et leurs bulletins
- 👨‍🏫 Enseignants
- 🏫 Classes
- 💰 Paiements et frais scolaires
- 📊 Tableaux de bord et statistiques

---

## 📋 Prérequis Système

### Configuration Minimale Requise

| Composant | Exigence |
|-----------|----------|
| **Système d'exploitation** | Windows 10/11 (64-bit) |
| **Processeur** | Intel Core i3 ou équivalent |
| **Mémoire RAM** | 4 GB minimum (8 GB recommandé) |
| **Espace disque** | 500 MB disponibles |
| **Résolution écran** | 1366×768 minimum |

### Permissions Requises
- Droits administrateur pour l'installation
- Accès en lecture/écriture sur le dossier d'installation

---

## 🚀 Méthodes d'Installation

### Méthode 1 : Installeur Windows (Recommandé)

L'installeur créera un raccourci dans le menu Démarrer et sur le bureau.

#### Étapes d'Installation

1. **Télécharger le fichier**
   - Fichier : `SchoolManage Setup 1.0.0.exe`
   - Taille : ~81 MB

2. **Lancer l'installation**
   ```powershell
   Double-cliquez sur "SchoolManage Setup 1.0.0.exe"
   ```

3. **Suivre l'assistant**
   - Choisissez la langue (Français par défaut)
   - Acceptez les conditions de licence
   - Sélectionnez le dossier d'installation (par défaut : `C:\Program Files\SchoolManage`)
   - Cliquez sur "Installer"

4. **Terminer l'installation**
   - L'installeur créera automatiquement :
     - Un raccourci sur le Bureau
     - Une entrée dans le Menu Démarrer
     - Une entrée dans "Ajouter ou supprimer des programmes"

#### Désinstallation
```powershell
Panneau de configuration → Programmes → SchoolManage → Désinstaller
```

---

### Méthode 2 : Version Portable

La version portable ne nécessite pas d'installation. Parfaite pour une utilisation sur clé USB ou pour tester l'application.

#### Utilisation

1. **Télécharger le fichier**
   - Fichier : `SchoolManage 1.0.0.exe`
   - Taille : ~81 MB

2. **Placer l'exécutable**
   ```powershell
   # Copiez le fichier où vous voulez, par exemple :
   C:\SchoolManage\
   D:\Applications\SchoolManage\
   ou sur une clé USB
   ```

3. **Lancer l'application**
   ```powershell
   Double-cliquez sur "SchoolManage 1.0.0.exe"
   ```

#### Avantages de la Version Portable
- ✅ Aucune installation requise
- ✅ Aucune modification du registre Windows
- ✅ Peut être déplacée facilement
- ✅ Données stockées dans le même dossier que l'application

#### Suppression
```powershell
Supprimez simplement le dossier contenant l'exécutable
```

---

## 🔐 Première Connexion

### Identifiants par Défaut

L'application crée automatiquement un compte administrateur : 

| Champ | Valeur |
|-------|--------|
| **Identifiant** | `admin` |
| **Mot de passe** | `admin123` |

> ⚠️ **IMPORTANT** : Changez le mot de passe par défaut dès la première connexion pour des raisons de sécurité.

### Connexion
1. Lancez l'application
2. Sur l'écran de login, saisissez les identifiants
3. Cliquez sur "Connexion"

---

## 🛠️ Dépannage

### Problème : L'application ne démarre pas

**Solution 1 : Vérifier les prérequis**
```powershell
# Vérifiez votre version de Windows
winver
```
- Windows 10 ou 11 requis (64-bit)

**Solution 2 : Exécuter en mode administrateur**
1. Clic droit sur l'icône SchoolManage
2. Sélectionner "Exécuter en tant qu'administrateur"

**Solution 3 : Vérifier l'antivirus**
- Certains antivirus peuvent bloquer l'application
- Ajoutez une exception pour `SchoolManage.exe`

---

### Problème : Base de données corrompue

**Symptômes** : L'application se fige ou affiche des erreurs SQL

**Solution** :
```powershell
# Localisation de la base de données
# Version installée :
%APPDATA%\SchoolManage\schoolmanage.db

# Version portable :
<Dossier de l'application>\schoolmanage.db
```

1. Fermez l'application
2. Sauvegardez le fichier `schoolmanage.db` (copie de sécurité)
3. Redémarrez l'application

---

### Problème : Affichage incorrect (texte coupé, interface trop petite)

**Solution** :
1. Fermez l'application
2. Clic droit sur `SchoolManage.exe`
3. Propriétés → Compatibilité
4. Cochez "Modifier les paramètres PPP élevés"
5. Cochez "Remplacer le comportement de mise à l'échelle PPP élevée"
6. Sélectionnez "Système (amélioré)"

---

## 🔄 Mise à Jour de l'Application

### Méthode 1 : Avec l'installeur
1. Téléchargez la nouvelle version
2. Exécutez l'installeur
3. Il détectera l'installation existante et mettra à jour

### Méthode 2 : Version portable
1. Sauvegardez votre base de données (`schoolmanage.db`)
2. Remplacez l'ancien exécutable par le nouveau
3. Restaurez la base de données si nécessaire

> 💡 **Conseil** : Faites toujours une sauvegarde avant une mise à jour

---

## 💾 Sauvegarde et Restauration

### Sauvegarde Manuelle

```powershell
# Localisation de la base de données
# Version installée :
Copy-Item "$env:APPDATA\SchoolManage\schoolmanage.db" "C:\Backups\schoolmanage_backup_$(Get-Date -Format 'yyyyMMdd').db"

# Version portable :
Copy-Item "C:\SchoolManage\schoolmanage.db" "C:\Backups\schoolmanage_backup_$(Get-Date -Format 'yyyyMMdd').db"
```

### Restauration

1. Fermez l'application
2. Copiez votre fichier de sauvegarde
3. Renommez-le en `schoolmanage.db`
4. Remplacez le fichier existant
5. Redémarrez l'application

---

## 📞 Support et Assistance

### En Cas de Problème

1. **Consulter ce guide** de dépannage
2. **Vérifier les logs** de l'application :
   ```powershell
   # Version installée
   %APPDATA%\SchoolManage\logs\
   
   # Version portable
   <Dossier app>\logs\
   ```
3. **Contacter le support** avec :
   - Version de Windows
   - Version de SchoolManage
   - Description du problème
   - Screenshots si applicable

---

## 📝 Notes Importantes

### Sécurité
- 🔒 Changez le mot de passe admin par défaut
- 🔒 Effectuez des sauvegardes régulières
- 🔒 Ne partagez pas vos identifiants

### Performance
- 📌 Fermez les modules inutilisés pour économiser la mémoire
- 📌 Videz régulièrement l'historique des paiements anciens
- 📌 Optimisez la base de données mensuellement via les paramètres

---

## ✨ Fonctionnalités Principales

### Gestion des Élèves
- Inscription et dossiers complets
- Gestion des classes et niveaux
- Suivi des absences et retards
- Cartes scolaires avec photo

### Bulletins Scolaires
- Saisie des notes par trimestre
- Calcul automatique des moyennes
- Appréciations automatiques
- Impression des bulletins 7e-9e
- Impression des bulletins primaire

### Gestion Financière
- Suivi des paiements des frais scolaires
- Gestion des soldes et restes à payer
- Rapports financiers
- Historique des transactions

### Administration
- Gestion des enseignants
- Configuration des classes
- Paramètres de l'année scolaire
- Tableau de bord avec statistiques

---

**Version du Guide** : 1.0.0  
**Dernière mise à jour** : Avril 2026  
**Application** : SchoolManage v1.0.0
