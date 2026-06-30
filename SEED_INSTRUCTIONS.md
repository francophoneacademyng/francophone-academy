# Instructions — Seed Firestore

Ce document explique comment peupler Firestore avec les donnees initiales (8 cours, 24 modules, 72 lecons, 6 quiz, questions types, et un compte admin).

---

## Prerequis

- Node.js 20+ (`node --version`)
- Firebase CLI installe (`firebase --version`)
- Un projet Firebase actif avec Firestore enabled
- Une cle de service Firebase (service account key)

---

## Etape 1 : Telecharger la cle de service Firebase

1. Ouvrez la [Console Firebase](https://console.firebase.google.com)
2. Allez dans **Parametres du projet** (roue crantee) > **Comptes de service**
3. Cliquez sur **Generer une nouvelle cle privee**
4. Enregistrez le fichier JSON (ex: `serviceAccountKey.json`)
5. Placez ce fichier a la racine du projet (`francophone-academy-production-base/`)

> **Securite** : Ne commitez jamais ce fichier. Il est deja ignore dans `firebase.json`.

---

## Etape 2 : Installer la dependance

Dans le dossier `francophone-academy-production-base/` :

```bash
npm install
```

Cela installe `firebase-admin` (seule dependance necessaire pour le seed).

> Si vous avez deja installe les dependances des Cloud Functions (`cd functions && npm install`), vous pouvez aussi executer le script depuis le dossier `functions/` en copiant `seedFirestore.js` dedans. La methode `npm install` ci-dessus est la plus simple.

---

## Etape 3 : Lancer le seed

### Option A — Sur le projet Firebase en ligne (production)

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
node seedFirestore.js
```

### Option B — Sur l'emulateur Firestore (local)

1. Demarrez les emulateurs dans un autre terminal :
```bash
firebase emulators:start --only firestore
```

2. Dans un autre terminal, lancez le seed :
```bash
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
export FIRESTORE_EMULATOR_HOST=localhost:8080
node seedFirestore.js
```

---

## Sortie attendue

```
================================================
  Francophone Academy -- Seed Firestore
================================================
  Projet : votre-projet-firebase
  Date   : 2026-06-29T12:00:00.000Z
  Mode   : IDEMPOTENT (relancer = sans doublons)
================================================

--- COURSES ---
  [CREATE] courses/course_a1_beginner
  [CREATE] courses/course_a2_elementary
  ...
  Resultat : 8 cree(s), 0 ignore(s)

--- MODULES ---
  Resultat : 24 cree(s), 0 ignore(s)

--- LESSONS ---
  Resultat : 72 cree(s), 0 ignore(s)

--- QUIZZES ---
  Resultat : 6 cree(s), 0 ignore(s)

--- CERTIFICATE TEMPLATES ---
  [CREATE] Template de certificat par defaut

--- ADMIN USER ---
  [CREATE] Admin + Custom Claims (role: superadmin)

--- MISE A JOUR DES COMPTEURS COURS ---

================================================
  RESUME
================================================
  ...
  TOTAL             : 111 document(s) cree(s)
  TOTAL             : 0 document(s) ignore(s)
================================================
  ✓ Seed termine avec succes !
================================================
```

---

## Idempotence

Le script peut etre relance sans risque. Chaque document est verifie avant creation :

```bash
node seedFirestore.js   # 1ere execution : cree tout
node seedFirestore.js   # 2eme execution : "SKIP -- existe deja" pour tout
```

Cela est utile si le script est interrompu ou si vous voulez ajouter de nouvelles donnees plus tard.

---

## Donnees creees

| Collection | Documents | Description |
|------------|-----------|-------------|
| `courses` | 8 | Cours CECRL A1 a C2 + DELF + Pro |
| `modules` | 24 | 3 modules par cours |
| `lessons` | 72 | 3 lecons par module (theorie, exercice, culture) |
| `quizzes` | 6 | Quiz par niveau + examen blanc DELF |
| `questions` | ~40 | QCM, Vrai/Faux, Fill in Blank, Short Answer, Matching, Ordering, Open Ended |
| `certificate_templates` | 1 | Modele de certificat par defaut |
| `users` | 1 | Compte admin (superadmin) |

---

## Donnees NON creees (creees automatiquement par l'app)

Ces collections sont gerees par les Cloud Functions ou l'application :

| Collection | Cree par |
|------------|----------|
| `users` (eleves) | Trigger `onUserCreated` |
| `student_progress` | Trigger `onUserCreated` |
| `subscriptions` | Trigger `onUserCreated` |
| `enrollments` | Action utilisateur (inscription a un cours) |
| `quiz_results` | Cloud Function `submitQuiz` |
| `payments` | Cloud Function `validatePayment` |
| `certificates` | Cloud Function `generateCertificate` |

---

## Depannage

| Probleme | Solution |
|----------|----------|
| `Error: 7 PERMISSION_DENIED` | Verifiez `GOOGLE_APPLICATION_CREDENTIALS` et le contenu du JSON |
| `Cannot find module 'firebase-admin'` | Lancez `npm install` dans le bon dossier |
| `Document admin cree mais pas les claims` | Normal si l'utilisateur Auth n'existe pas. Creez-le via Firebase Auth Console. |
| `Firestore emulator non detecte` | Verifiez que `FIRESTORE_EMULATOR_HOST=localhost:8080` est exporte |

---

## Commande raccourcie

Si vous avez configure `firebase.json` correctement, vous pouvez aussi utiliser :

```bash
# Seed + deploy en une seule commande
npm run seed && firebase deploy
```
