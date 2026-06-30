/**
 * firebaseErrors.js
 * Traduction des erreurs Firebase en messages utilisateur en francais.
 * Centralise tous les messages d'erreur de l'application.
 */

const ERROR_MAP = {
  // Firebase Auth errors
  'auth/invalid-email': 'Adresse e-mail invalide. Veuillez verifier le format.',
  'auth/user-disabled': 'Ce compte a ete desactive. Contactez le support.',
  'auth/user-not-found': 'Aucun compte ne correspond a cette adresse e-mail.',
  'auth/wrong-password': 'Mot de passe incorrect. Veuillez reessayer.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/email-already-in-use': 'Cette adresse e-mail est deja utilisee.',
  'auth/weak-password': 'Le mot de passe est trop faible. Utilisez au moins 6 caracteres.',
  'auth/too-many-requests': 'Trop de tentatives. Veuillez patienter quelques minutes.',
  'auth/network-request-failed': 'Probleme de connexion. Verifiez votre reseau.',
  'auth/popup-closed-by-user': 'La fenetre de connexion a ete fermee.',
  'auth/cancelled-popup-request': 'La connexion a ete annulee.',
  'auth/account-exists-with-different-credential': 'Un compte existe deja avec cette adresse e-mail mais une autre methode de connexion.',
  'auth/requires-recent-login': 'Pour des raisons de securite, veuillez vous reconnecter.',
  'auth/operation-not-allowed': 'Cette operation n\'est pas autorisee. Contactez le support.',
  'auth/timeout': 'La requete a expire. Veuillez reessayer.',

  // Firestore errors
  'permission-denied': 'Vous n\'avez pas les permissions necessaires.',
  'not-found': 'Document introuvable.',
  'already-exists': 'Cette ressource existe deja.',
  'resource-exhausted': 'Quota depasse. Veuillez patienter.',
  'unauthenticated': 'Vous devez etre connecte pour effectuer cette action.',
  'unavailable': 'Service temporairement indisponible. Veuillez reessayer.',

  // Generiques
  'default': 'Une erreur est survenue. Veuillez reessayer.',
  'network': 'Probleme de connexion internet. Verifiez votre reseau.',
  'unknown': 'Une erreur inattendue est survenue.'
};

/**
 * Traduit une erreur Firebase en message utilisateur francais.
 * @param {Error|string} error — Erreur Firebase ou code d'erreur
 * @returns {string} Message en francais
 */
export function translateFirebaseError(error) {
  if (!error) return ERROR_MAP.default;

  const code = typeof error === 'string' ? error : error.code || error.message;

  // Recherche directe par code
  if (ERROR_MAP[code]) return ERROR_MAP[code];

  // Recherche par inclusion
  for (const [key, message] of Object.entries(ERROR_MAP)) {
    if (code && code.includes(key)) return message;
  }

  // Messages contenant certains mots-cles
  if (code?.includes('network') || code?.includes('offline')) return ERROR_MAP.network;
  if (code?.includes('permission')) return ERROR_MAP['permission-denied'];
  if (code?.includes('not-found')) return ERROR_MAP['not-found'];

  return ERROR_MAP.default;
}

/**
 * Retourne le message d'erreur pour un champ de formulaire specifique.
 * @param {string} field — Nom du champ
 * @param {string} code — Code d'erreur
 * @returns {string}
 */
export function getFieldError(field, code) {
  const fieldErrors = {
    email: {
      'auth/invalid-email': 'Veuillez entrer une adresse e-mail valide.',
      'auth/user-not-found': 'Aucun compte associe a cet e-mail.',
      'auth/email-already-in-use': 'Cet e-mail est deja utilise.'
    },
    password: {
      'auth/wrong-password': 'Mot de passe incorrect.',
      'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caracteres.',
      'auth/invalid-credential': 'Email ou mot de passe incorrect.'
    }
  };

  return fieldErrors[field]?.[code] || translateFirebaseError(code);
}
