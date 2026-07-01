# Audit Francophone Academy

## Architecture

- Frontend: Static Firebase Hosting pages under `pages/` and root assets.
- Backend: Firebase Cloud Functions in `functions/`.
- Firestore: Security rules declared in `firestore.rules`, indexes in `firestore.indexes.json`.
- Authentication: Firebase Auth with user profile and role-based access.
- Payments: Paystack integration via server-side Cloud Functions and frontend Paystack inline.
- AI Tutor: Cloud Function proxy for tutor interactions, likely using third-party AI provider.

## Points forts

- Existing Firebase hosting and rewrites support all frontend routes.
- Clear separation between pages, services, repositories, and models.
- Backend cloud functions already implement payment validation, tutor proxy, and notifications.
- Firestore rules exist and are reasonably structured with role checks.
- Design and navigation are present on all major pages.

## Faiblesses

- No dedicated landing page at `/index.html`.
- CSS is page-specific and not organized as a design system.
- A large number of HTML pages duplicate layout and navigation structure.
- `manifest.json` exists but no dedicated `index.html` or SEO-enhanced landing.
- Multiple debug or old structure files were present.
- Paystack public and secret keys are placeholders; frontend config exposes placeholder key.
- `robots.txt` disallows pages that may be valid for authenticated users.

## Dette technique

- Duplicate sidebar/navigation markup across pages.
- Lack of shared CSS and JS modules for layout/theme.
- Hardcoded strings and route references in HTML pages.
- Some Firestore rules may be overly permissive for staff roles.
- No automated tests or validation scripts in the frontend.

## Erreurs

- 404 page currently links directly to internal pages rather than public routes.
- `firebase.rules` path previously misread; file is valid though.
- `package.json` dev dependency only includes firebase-admin, no lint/test tooling.

## Risques

- Cloud Functions environment variables may not be configured on deployment.
- Paystack validation depends on correct secret and plan pricing matching.
- AI proxy could expose unbounded costs if not rate-limited.
- Public hosting uses `no-cache, no-store` for JS/CSS, which may hurt performance.
- Static `sitemap.xml` references deployed site but may not include landing page.

## Optimisations

- Add shared design system CSS files under `assets/css/`.
- Create an accessible, SEO-optimized `index.html` landing page.
- Centralize shared JS modules in `src/utils/` and `assets/js/` if needed.
- Improve Firestore caching rules for static assets and pages.
- Generate `sitemap.xml` and improve `robots.txt` for production.
- Add `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/DEPLOYMENT.md`.

## Fichiers morts

- `structure.txt`
- `structure_projet.txt`
- `structure_sans_node_modules.txt`

## Doublons

- Multiple page-specific sidebars and menu patterns.
- Duplicate page headers and footers.

## Fichiers inutilisés

- No obvious unused JS from read search, but pages missing central shared assets.

## Fichiers manquants

- `index.html`
- `assets/css/design-system.css`
- `assets/css/components.css`
- `assets/css/layout.css`
- `assets/css/landing.css`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/DEPLOYMENT.md`
- `docs/CHANGELOG.md`
- `docs/FINAL_REPORT.md`
