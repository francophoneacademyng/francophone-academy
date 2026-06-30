/**
 * logger.js
 * Systeme de journalisation serveur.
 * Toutes les operations critiques sont loggees dans Firestore (logs/).
 */

const { db, COLLECTIONS } = require('../config/firebaseAdmin');

const LOG_TYPES = {
  AUTH: 'auth',
  PAYMENT: 'payment',
  CERTIFICATE: 'certificate',
  QUIZ: 'quiz',
  TUTOR: 'tutor',
  NOTIFICATION: 'notification',
  ADMIN: 'admin',
  ERROR: 'error',
  SECURITY: 'security'
};

/**
 * Enregistre un log dans Firestore.
 * @param {string} type — Type de log
 * @param {string} action — Action effectuee
 * @param {string} userId — ID utilisateur (optionnel)
 * @param {Object} data — Donnees supplementaires
 * @param {string} severity — info | warning | error | critical
 */
async function log(type, action, userId = '', data = {}, severity = 'info') {
  try {
    const logEntry = {
      type,
      action,
      userId,
      data: sanitizeLogData(data),
      severity,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    };
    await db.collection(COLLECTIONS.LOGS).add(logEntry);
  } catch (err) {
    console.error(`[Logger] Erreur d'enregistrement:`, err.message);
  }
}

/**
 * Sanitize les donnees de log (supprime les infos sensibles).
 */
function sanitizeLogData(data) {
  const sensitive = ['password', 'token', 'secret', 'apiKey', 'authorization', 'creditCard'];
  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '***REDACTED***';
    }
  }
  return sanitized;
}

/**
 * Log rapide pour les paiements.
 */
async function logPayment(action, userId, data, severity = 'info') {
  return log(LOG_TYPES.PAYMENT, action, userId, data, severity);
}

/**
 * Log rapide pour les certificats.
 */
async function logCertificate(action, userId, data, severity = 'info') {
  return log(LOG_TYPES.CERTIFICATE, action, userId, data, severity);
}

/**
 * Log rapide pour les quiz.
 */
async function logQuiz(action, userId, data, severity = 'info') {
  return log(LOG_TYPES.QUIZ, action, userId, data, severity);
}

/**
 * Log rapide pour les erreurs.
 */
async function logError(action, userId, error, severity = 'error') {
  return log(LOG_TYPES.ERROR, action, userId, {
    message: error.message,
    stack: error.stack,
    ...error
  }, severity);
}

/**
 * Log securite (tentatives de falsification, acces non autorises).
 */
async function logSecurity(action, userId, data, severity = 'warning') {
  return log(LOG_TYPES.SECURITY, action, userId, data, severity);
}

/**
 * Log auth (connexions, deconnexions, creation compte).
 */
async function logAuth(action, userId, data, severity = 'info') {
  return log(LOG_TYPES.AUTH, action, userId, data, severity);
}

const { admin } = require('../config/firebaseAdmin');

module.exports = {
  log,
  logPayment,
  logCertificate,
  logQuiz,
  logError,
  logSecurity,
  logAuth,
  LOG_TYPES
};
