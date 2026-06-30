/**
 * validators.js
 * Validateurs serveur pour toutes les entrees Cloud Functions.
 * Aucune donnee n'est traitee sans validation.
 */

const { CEFR_LEVELS } = require('../config/firebaseAdmin');

/**
 * Verifie si une chaine est un UID Firebase valide.
 */
function isValidUid(uid) {
  return typeof uid === 'string' && uid.length >= 10 && /^[a-zA-Z0-9]+$/.test(uid);
}

/**
 * Verifie si un email est valide.
 */
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Verifie si un niveau CECRL est valide.
 */
function isValidCEFR(level) {
  return Object.values(CEFR_LEVELS).includes(level);
}

/**
 * Verifie si un score est valide (0-100).
 */
function isValidScore(score) {
  return typeof score === 'number' && score >= 0 && score <= 100;
}

/**
 * Verifie si un montant est valide.
 */
function isValidAmount(amount) {
  return typeof amount === 'number' && amount >= 0;
}

/**
 * Verifie si une reference Paystack est valide.
 */
function isValidPaystackRef(ref) {
  return typeof ref === 'string' && ref.length >= 5;
}

/**
 * Verifie si un numero de certificat est valide.
 */
function isValidCertificateNumber(number) {
  return typeof number === 'string' && /^FA-[A-C][1-2]-\d{6}-[A-Z0-9]{6}$/.test(number);
}

/**
 * Nettoie une chaine (XSS protection basique).
 */
function sanitizeString(str, maxLength = 200) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, maxLength);
}

/**
 * Verifie si un plan d'abonnement est valide.
 */
function isValidPlan(plan) {
  return ['free', 'standard', 'professional', 'enterprise'].includes(plan);
}

/**
 * Valide les donnees d'une requete de paiement.
 */
function validatePaymentRequest(data) {
  const errors = [];
  if (!isValidUid(data.userId)) errors.push('userId invalide');
  if (!isValidPlan(data.plan)) errors.push('plan invalide');
  if (!isValidPaystackRef(data.reference)) errors.push('reference Paystack invalide');
  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

/**
 * Valide les donnees d'une requete de certificat.
 */
function validateCertificateRequest(data) {
  const errors = [];
  if (!isValidUid(data.userId)) errors.push('userId invalide');
  if (!data.courseId) errors.push('courseId requis');
  if (!isValidCEFR(data.cefrLevel)) errors.push('niveau CECRL invalide');
  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

/**
 * Valide les donnees d'une requete de quiz.
 */
function validateQuizRequest(data) {
  const errors = [];
  if (!isValidUid(data.userId)) errors.push('userId invalide');
  if (!data.quizId) errors.push('quizId requis');
  if (!data.attemptId) errors.push('attemptId requis');
  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

module.exports = {
  isValidUid,
  isValidEmail,
  isValidCEFR,
  isValidScore,
  isValidAmount,
  isValidPaystackRef,
  isValidCertificateNumber,
  sanitizeString,
  isValidPlan,
  validatePaymentRequest,
  validateCertificateRequest,
  validateQuizRequest
};
