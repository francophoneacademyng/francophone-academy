# Architecture du projet Francophone Academy

## Vue d'ensemble

Francophone Academy est une application SaaS basée sur Firebase, composée de deux parties principales :

- Frontend : pages HTML statiques servies via Firebase Hosting.
- Backend : Cloud Functions Firebase pour l'authentification, les paiements, les certificats, le quiz et le tuteur IA.

## Frontend

- `index.html` : page d'accueil professionnelle et SEO-friendly.
- `pages/` : ensemble des interfaces utilisateur pour l'inscription, la connexion, la gestion de l'utilisateur, le tutorat IA, les cours, les quiz et les paiements.
- `assets/css/` : design system et styles partagés.
- `src/` : code JavaScript organisé en services, contrôleurs, modèles, dépôts et utilitaires.

## Backend

- `functions/` : Cloud Functions Firebase.
- `functions/index.js` : point d'entrée principal et export des fonctions.
- `functions/config/firebaseAdmin.js` : initialisation admin Firebase et lecture des secrets d'environnement.
- `functions/payments/validatePaystack.js` : validation serveur des paiements Paystack.
- `functions/tutor/aiProxy.js` : proxy IA du tuteur.
- `functions/shared/validators.js` : validation côté serveur des payloads.

## Firestore

- `firestore.rules` : règles de sécurité basées sur l'authentification et les rôles.
- `firestore.indexes.json` : index Firestore pour les requêtes optimales.

## Hosting

- `firebase.json` : configuration de l'hébergement, des en-têtes, des réécritures et des règles de cache.
- `manifest.json` : configuration PWA minimale.
- `sitemap.xml` : plan de site statique.
- `robots.txt` : directives des moteurs de recherche.

## Flux de paiement

- Le front-end initie le paiement via Paystack Inline.
- Le client redirige vers `/pages/payment/payment-success.html` ou `/pages/payment/payment-failed.html`.
- Le backend valide la transaction Paystack via `functions.validatePayment`.
- Les Cloud Functions mettent à jour les collections `payments`, `subscriptions`, `transactions` et `invoices`.

## IA Tutor

- Le tuteur IA passe par `functions.tutorProxy` pour maintenir les clés API côté serveur.
- Les messages sont enregistrés dans Firestore via `chat_sessions` et `chat_messages`.

## Observabilité et sécurité

- `firebase.json` définit des en-têtes de sécurité CSP, HSTS, X-Frame-Options, Referrer-Policy.
- Caching : JS/CSS en no-cache pour éviter les versions obsolètes, images en immutable.
- `robots.txt` limite l'exploration de certaines pages privées.

## Points d'amélioration

- Réduire les duplications de layout dans les pages existantes.
- Centraliser davantage la logique partagée JavaScript.
- Ajouter une gestion d'erreurs plus robuste pour le tuteur IA et la validation de paiement.
- Ajouter des tests automatisés frontend et backend.
