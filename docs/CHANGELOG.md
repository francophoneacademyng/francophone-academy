# Changelog

## 2026-07-01

- Création de `index.html` pour la landing page.
- Ajout du design system CSS partagé (`assets/css/design-system.css`, `layout.css`, `components.css`, `landing.css`).
- Mise en place de l'audit initial dans `docs/AUDIT.md`.
- Ajout de la documentation `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/DEPLOYMENT.md`.
- Suppression des anciens fichiers de structure obsolètes.
- Validation finale :
	- Firebase Hosting dry-run réussi.
	- Firestore Rules dry-run réussi.
	- Syntaxe JavaScript vérifiée sur `assets/js`, `pages/**/*.js`, `src/**/*.js` et `functions/**/*.js`.
	- Cloud Functions dry-run bloqué par le plan Firebase Spark : activation requise de Cloud Build / Artifact Registry sur Blaze.

- Release Candidate RC1 (préparation):
	- Fichiers modifiés et ajoutés pour la RC : pages HTML/CSS, `src/config/firebase.js`, `src/theme/ui-components.css`, assets CSS/JS, et documentation `docs/*`.
	- Suppressions incluses : anciens fichiers de structure obsolètes.
	- Validations exécutées : Hosting dry-run OK, Firestore Rules dry-run OK, JS syntax checks OK.
	- Validations non exécutées : Functions dry-run complet (bloqué par plan Spark / Blaze requis).
