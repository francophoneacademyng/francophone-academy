# Audit Fonctionnel Complet de la Plateforme
## Francophone Academy

Date de l'audit: 2 juillet 2026  
Périmètre: inspection statique de l'ensemble des pages présentes dans `pages/`, des vues et contrôleurs associés, des points d'entrée globaux, et des flux utilisateur demandés.  
Méthode: revue des fichiers, vérification des chemins, inspection des liaisons navigationnelles et des dépendances apparentes.  
Aucune modification de code n'a été effectuée.

---

## Résumé exécutif

La plateforme dispose d'une base fonctionnelle solide pour les parcours principaux: accueil, authentification, tableau de bord, cours, leçons, quiz, tuteur IA, certificats, vérification publique, tarifs et classes Live. L'architecture est globalement cohérente et plusieurs pages sont correctement raccordées aux contrôleurs et services.

En revanche, l'audit a identifié des lacunes structurelles importantes: certaines pages attendues n'existent pas du tout, plusieurs liens pointent vers des routes inexistantes, des zones d'interface sont encore des placeholders, et quelques écrans présentent des risques de rupture de parcours ou de droits d'accès insuffisamment protégés.

Les problèmes les plus sensibles concernent l'administration absente côté pages, l'édition de classes Live qui mène vers une page inexistante, et des contrôles d'affichage qui empêchent certains blocs de chargement d'apparaître correctement.

---

## 1. Fonctionnalités opérationnelles

### Parcours confirmés comme présents et globalement structurés

| Domaine | État | Observations |
|---|---|---|
| Accueil | Fonctionnel | Page d'entrée bien structurée, navigation principale visible, CTA cohérents. |
| Connexion / Inscription | Fonctionnel | Flux branché sur `AuthView` / `AuthController`, avec écran forgot password intégré en vue. |
| Prix | Fonctionnel | Page tarifaire présente, chargement des abonnements et historique des paiements prévu. |
| Tableau de bord | Fonctionnel partiel | Structure présente, sections principales raccordées, mais certains liens restent placeholders. |
| Cours | Fonctionnel partiel | Page existante et intégrée au parcours étudiant. |
| Leçons | Fonctionnel partiel | Parcours de lecture et navigation contextualisée présents. |
| Quiz | Fonctionnel partiel | Moteur d'affichage et de navigation des questions présent, avec support multi-types. |
| Tuteur IA | Fonctionnel partiel | Contexte de cours/lesson injecté et interface de chat présente. |
| Certificats | Fonctionnel partiel | Liste et consultation de certificat disponibles. |
| Vérification de certificat | Fonctionnel | Page publique dédiée, sans authentification requise. |
| Classes Live | Fonctionnel partiel | Liste, détail, création et jointure présents. |

### Éléments positifs notables

- L'architecture globale suit une séparation claire entre vues, contrôleurs et services.
- Les parcours d'authentification et de tuteur IA sont bien intégrés dans le flux principal.
- La page de vérification publique de certificat est indépendante de la session utilisateur, ce qui est conforme à un usage externe.
- Les sections de dashboard, pricing, certificates et live classes montrent une intention de couverture produit réelle, pas seulement des maquettes visuelles.

---

## 2. Pages et fonctionnalités manquantes

### Pages absentes du codebase

| Page demandée | Statut | Gravité | Commentaire |
|---|---|---:|---|
| Forgot Password | Absente en tant que page dédiée | MEDIUM | Le mot de passe oublié existe comme écran interne à l'authentification, mais pas comme page autonome sous `pages/`. |
| Course Details | Absente | HIGH | Aucun point d'entrée dédié n'existe pour détailler un cours. |
| Profile | Absente | MEDIUM | Le dashboard expose un lien vers le profil, mais aucune page dédiée n'existe. |
| Settings | Absente | MEDIUM | Le dashboard expose des accès paramètres, mais sans page dédiée. |
| Admin pages | Absentes | CRITICAL | Aucun répertoire `pages/admin` ni page d'administration n'existe. |
| Live Class Edit | Absente | HIGH | Les actions d'édition de classe pointent vers `edit.html`, qui n'existe pas. |

### Fonctionnalités attendues mais incomplètes

| Fonctionnalité | Statut | Gravité | Commentaire |
|---|---|---:|---|
| Gestion de profil utilisateur | Incomplète | MEDIUM | Le flux est présent dans l'authentification, mais pas exposé comme parcours page indépendant. |
| Gestion des paramètres | Incomplète | MEDIUM | Les liens existent dans le dashboard mais mènent à des placeholders. |
| Administration du contenu | Incomplète | CRITICAL | La vue admin existe côté `src/views`, mais aucun écran de production n'est exposé dans `pages/`. |
| Édition de classes Live | Incomplète | HIGH | Navigation cassée vers une page inexistante. |

---

## 3. Pages brisées ou à risque

### Problèmes confirmés

| Sévérité | Page / fichier | Problème | Impact |
|---|---|---|---|
| HIGH | `pages/live-classes/live-classes.js` | Le bouton d'édition redirige vers `/pages/live-classes/edit.html`, fichier absent. | Rupture de parcours enseignant. |
| HIGH | `pages/live-classes/detail.js` | Même redirection cassée vers `edit.html`. | Rupture de parcours détaillé et édition impossible. |
| HIGH | `pages/teacher/teacher.js` | Le bloc financier recherche `.teacher-main`, alors que le HTML expose `main.dashboard-main`. | Le chargement des statistiques financières ne s'affiche pas. |
| MEDIUM | `pages/quiz/quiz.js` | Le rendu matching utilise `[...question.pairs]` sans garde robuste. | Risque d'exception si `pairs` est absent ou invalide. |
| MEDIUM | `pages/dashboard/dashboard.html` | Plusieurs liens utilisent `href="#"`. | Navigation incomplète et risque de faux clics. |
| MEDIUM | `pages/dashboard/dashboard.html` | Le lien paramètres de la sidebar et du menu utilisateur ne mène nulle part. | Attente utilisateur non satisfaite. |

### Écrans à risque de dégradation fonctionnelle

| Sévérité | Composant | Risque | Impact |
|---|---|---|---|
| MEDIUM | `src/views/AdminView.js` | Vue riche mais non exposée comme page autonome. | Fonctionnalité admin peu accessible. |
| MEDIUM | `src/views/AuthView.js` | Auth peut afficher forgot/profile en interne mais la navigation page n'est pas standardisée. | Parcours moins clair pour l'utilisateur. |
| LOW | `pages/certificate/certificate.js` | Le lien de vérification peut tomber sur `#` si l'URL n'est pas fournie. | Expérience incomplète sur certains certificats. |

---

## 4. Formulaires brisés ou fragiles

### Formulaires à surveiller

| Sévérité | Fichier | Problème | Détail |
|---|---|---|---|
| MEDIUM | `pages/quiz/quiz.js` | Gestion incomplète de certains types de question | La structure de réponse n'est pas totalement défensive pour les questions de type matching. |
| MEDIUM | `pages/teacher/teacher.js` | Formulaires de création dépendants d'éléments DOM très précis | Si un bloc manque dans le HTML, le flux de création peut casser silencieusement. |
| LOW | `pages/verify-certificate/verify-certificate.js` | Dépendance forte aux IDs HTML attendus | Fonctionne si le DOM est présent, mais peu tolérant aux changements de structure. |

### Observations générales

- Les formulaires principaux existent, mais plusieurs restent fortement couplés à des IDs et à une structure DOM précise.
- Les états d'erreur ne sont pas toujours homogènes entre les pages.
- Le rendu de secours est souvent textuel et peu standardisé.

---

## 5. Navigation brisée

### Liens morts ou routes inexistantes

| Sévérité | Source | Cible | Impact |
|---|---|---|---|
| HIGH | `pages/live-classes/live-classes.js` | `/pages/live-classes/edit.html` | Route 404 probable. |
| HIGH | `pages/live-classes/detail.js` | `/pages/live-classes/edit.html` | Route 404 probable. |
| MEDIUM | `pages/dashboard/dashboard.html` | `#` pour profil | Aucun vrai parcours. |
| MEDIUM | `pages/dashboard/dashboard.html` | `#` pour paramètres | Aucun vrai parcours. |
| MEDIUM | `pages/dashboard/dashboard.html` | `../lesson/lesson.html` sans paramètre | Navigation vers la page leçon sans contexte explicite. |

### Chaînes de navigation incomplètes

- Le parcours visiteur vers profil/paramètres n'existe pas.
- Le parcours enseignant vers l'édition de classe Live est rompu.
- Le parcours administrateur n'a pas de point d'entrée dans `pages/`.
- Le parcours cours détail n'a pas de landing dédiée.

---

## 6. Intégrations manquantes

### Firebase / Firestore / Auth

| Sévérité | Domaine | Manque | Commentaire |
|---|---|---|---|
| CRITICAL | Admin pages | Absence d'intégration page-level | Les vues et services admin existent côté `src/`, mais aucun écran de production n'est exposé. |
| HIGH | Live classes edit | Route inexistante | Le flux Firestore / contrôle n'a pas de page d'édition cible. |
| MEDIUM | Profile / Settings | Intégration incomplète | Les liens existent mais pas les pages ou routes complètes. |
| MEDIUM | Dashboard settings | Navigation non intégrée | Le menu pointe vers des placeholders au lieu d'un module réel. |

### Services front/back partiellement exposés

- `AuthController` gère le forgot password dans la vue d'authentification, mais pas comme page autonome.
- `DashboardController` expose des actions de configuration et de détails, mais plusieurs restent en état « bientôt disponible ».
- `TeacherController` / `PaymentController` semblent alimenter la vue, mais certains conteneurs HTML ne correspondent pas.

---

## 7. Incohérences UI

| Sévérité | Fichier | Incohérence | Impact |
|---|---|---|---|
| HIGH | `pages/teacher/teacher.js` + `pages/teacher/teacher.html` | Sélecteur `.teacher-main` introuvable dans le HTML | Bloc financier invisible. |
| MEDIUM | `pages/dashboard/dashboard.html` | Liens de profil/paramètres non finalisés | Impression d'interface incomplète. |
| LOW | `index.html` | Police globale Inter imposée | Cohérence visuelle correcte mais peu différenciante au regard du reste du système. |
| LOW | `pages/verify-certificate/verify-certificate.js` | Gestion d'état résultat simple | UI fonctionnelle mais minimale. |

### Observations d'ensemble

- La plateforme mélange des écrans finalisés et des blocs encore très exploratoires.
- Certaines sections paraissent prêtes visuellement, mais le branchement fonctionnel est incomplet.
- L'expérience est plus solide sur les parcours cœur que sur les fonctions périphériques.

---

## 8. Problèmes Firebase

### Points observés

| Sévérité | Fichier | Problème | Détail |
|---|---|---|---|
| HIGH | `pages/teacher/teacher.js` | Dépendance au chargement de statistiques financières sans conteneur HTML cible valide | La récupération peut réussir, mais l'affichage est perdu. |
| MEDIUM | `src/views/AdminView.js` | Vue admin construite côté front sans page exposée | Risque d'écart entre logique métier et surface utilisateur. |
| MEDIUM | `pages/quiz/quiz.js` | Types de questions variés nécessitent des données parfaitement structurées | Risque de crash si les documents Firestore sont incomplets. |
| LOW | `pages/verify-certificate/verify-certificate.js` | Dépendance à la présence du numéro dans l'URL ou dans le champ | Fonctionne, mais expérience fragile si les paramètres sont manquants. |

### Remarque technique

Aucun problème syntaxique majeur n'a été relevé dans les fichiers inspectés, mais plusieurs flux dépendent fortement d'une cohérence stricte entre DOM, données Firestore et contrôleurs.

---

## 9. Sécurité et risques

| Sévérité | Domaine | Risque | Commentaire |
|---|---|---|---|
| MEDIUM | Teacher page | Absence de contrôle de rôle visible au niveau de la page | Tout utilisateur authentifié peut potentiellement accéder à l'espace enseignant. |
| HIGH | Admin pages absentes | Aucun garde d'accès page-level disponible | Le périmètre admin n'est pas exposé de manière contrôlée dans `pages/`. |
| MEDIUM | Dashboard / menus | Liens de profil/paramètres vers `#` | Surface d'attaque faible, mais parcours non maîtrisé. |
| LOW | Quiz matching | Données malformées peuvent provoquer un plantage | Risque de déni de service local sur une vue. |

### Lecture sécurité

- L'authentification est globalement présente dans les points d'entrée principaux.
- Le contrôle des rôles semble plus centralisé dans les vues/contrôleurs que dans les pages elles-mêmes.
- Les pages admin n'étant pas exposées, la sécurité fonctionnelle est davantage un problème d'absence de produit que de fuite directe.

---

## 10. Priorités de correction

### CRITICAL

1. Exposer un vrai parcours administrateur sous `pages/` ou documenter clairement son absence.
2. Définir un point d'entrée de gestion admin sécurisé et relié aux vues existantes.

### HIGH

1. Corriger la navigation vers l'édition de classes Live, actuellement cassée.
2. Rendre le bloc financier enseignant visible en corrigeant le sélecteur DOM ou la structure HTML.
3. Créer un vrai parcours `Course Details` pour éviter le saut direct vers la leçon.

### MEDIUM

1. Créer des pages dédiées pour `Profile`, `Settings` et `Forgot Password` si elles doivent être accessibles comme parcours séparés.
2. Durcir le rendu des questions de quiz, notamment le type matching.
3. Remplacer les liens `#` du dashboard par de vraies routes ou supprimer ces entrées.
4. Harmoniser les états vides, d'erreur et de chargement entre les pages.

### LOW

1. Standardiser les messages de retour et les CTA secondaires.
2. Renforcer la lisibilité des blocs de secours lorsque les données Firebase sont absentes.

---

## 11. Parcours utilisateurs

### Visiteur anonyme

- Accueil: fonctionnel.
- Tarifs: fonctionnel.
- Inscription / connexion: fonctionnel.
- Mot de passe oublié: accessible dans l'authentification, mais pas comme page séparée.
- Vérification de certificat: fonctionnelle.

### Étudiant

- Connexion: fonctionnelle.
- Dashboard: présent et exploitable.
- Cours / leçons / quiz / tuteur IA / certificats: présents.
- Points faibles: absence de page de détail cours, navigation paramètres/profil incomplète.

### Enseignant

- Espace enseignant: présent.
- Création cours / quiz / leçons / classes Live: partiellement présent.
- Points faibles: édition de classe Live cassée, statistiques financières non montées, contrôle de rôle insuffisamment visible dans la page.

### Administrateur

- Parcours page-level: absent.
- Vue métier côté `src/views/AdminView.js`: présente.
- Conclusion: le besoin admin est techniquement amorcé, mais pas livré dans la couche `pages/`.

---

## 12. Cohérence documentaire et architecture académique

### Vérification de cohérence

- Le présent audit reste cohérent avec l'architecture académique déjà implémentée.
- Aucun fichier nommé `MASTER_BLUEPRINT` n'est présent dans le workspace; la cohérence a donc été vérifiée par comparaison avec l'architecture académique existante et les flux réellement codés.
- Les constats ci-dessus n'impliquent aucune modification du modèle académique ni des programmes.

### Conclusion de cohérence

La plateforme est fonctionnelle sur son socle principal, mais elle reste incomplète sur plusieurs parcours secondaires et sur l'administration. Les problèmes identifiés concernent surtout la couverture fonctionnelle, la navigation et l'exposition des écrans, pas la stratégie académique elle-même.

---

## Conclusion générale

Francophone Academy dispose d'un socle produit réel et déjà bien structuré. Les parcours essentiels sont là, mais plusieurs zones restent inachevées ou cassées au niveau de l'expérience utilisateur: administration inexistante côté pages, édition de classes Live cassée, profils/paramètres non finalisés, et quelques fragilités de rendu.

En l'état, la plateforme est exploitable pour les parcours principaux, mais ne peut pas encore être considérée comme totalement complète ni totalement stable sur l'ensemble des journeys demandés.
