# Déploiement Francophone Academy

## Prérequis

- Compte Firebase configuré pour le projet `francophone-academy`.
- Firebase CLI installé et connecté.
- Variables d'environnement Paystack définies dans Firebase Functions.

## Étapes de déploiement

1. Installer les dépendances de fonctions :
   ```powershell
   cd functions
   npm install
   ```

2. Vérifier les règles Firestore :
   ```powershell
   firebase deploy --only firestore:rules
   ```

3. Déployer les fonctions Cloud :
   ```powershell
   firebase deploy --only functions
   ```

4. Déployer l'hébergement :
   ```powershell
   firebase deploy --only hosting
   ```

## Variables d'environnement Firebase

- `PAYSTACK_SECRET_KEY`
- `OPENAI_API_KEY` ou autre clé IA selon proxy

## Vérification post-déploiement

- Tester la page d'accueil `https://<project>.web.app/`
- Vérifier la console Firebase pour erreurs d'hébergement.
- Tester l'authentification et la connexion.
- Vérifier les paiements Paystack en sandbox.
- Tester le tutorat IA via `/pages/tutor/tutor.html`.
