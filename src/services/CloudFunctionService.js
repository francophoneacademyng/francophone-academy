/**
 * CloudFunctionService.js
 * Point unique d'acces aux Cloud Functions Firebase.
 * Toutes les operations critiques securisees passent par ce service.
 *
 * Le client ne peut plus :
 * - Valider un paiement directement
 * - Generer un certificat directement
 * - Calculer un score de quiz
 * - Appeler l'IA directement (cles cachees)
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';
import { firebaseApp } from '../config/firebase.js';

const functions = getFunctions(firebaseApp);

// Mode developpement : connecter a l'emulateur
if (window.location.hostname === 'localhost') {
  try { connectFunctionsEmulator(functions, 'localhost', 5001); } catch (e) { /* ignore */ }
}

// ============================================
// HELPER : appel securise avec retry
// ============================================

async function callFunction(name, data, retries = 2) {
  const fn = httpsCallable(functions, name);
  let lastError;

  for (let i = 0; i <= retries; i++) {
    try {
      const result = await fn(data);
      return result.data;
    } catch (err) {
      lastError = err;
      if (i < retries) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }

  console.error(`[CloudFunction] ${name} failed:`, lastError);
  throw lastError;
}

// ============================================
// AUTH FUNCTIONS
// ============================================

export async function cfCreateUserProfile(data) {
  return callFunction('createUserProfile', data);
}

export async function cfAssignRole(userId, role) {
  return callFunction('assignRole', { userId, role });
}

export async function cfDeleteUserData(userId) {
  return callFunction('deleteUserData', { userId });
}

export async function cfSyncUserClaims(userId) {
  return callFunction('syncUserClaims', { userId });
}

// ============================================
// PAYMENT FUNCTIONS
// ============================================

/**
 * Valide un paiement Paystack et active l'abonnement.
 * SECURITE : Seule la Cloud Function peut verifier aupres de Paystack.
 */
export async function cfValidatePayment(reference, plan, duration = 'monthly') {
  return callFunction('validatePayment', { reference, plan, duration });
}

// ============================================
// CERTIFICATE FUNCTIONS
// ============================================

/**
 * Genere un certificat (conditions verifiees cote serveur).
 * SECURITE : Le client ne peut pas forcer la generation.
 */
export async function cfGenerateCertificate(courseId, courseTitle, courseLevel, cefrLevel) {
  return callFunction('generateCertificate', { courseId, courseTitle, courseLevel, cefrLevel });
}

/**
 * Revoke un certificat (admin uniquement).
 */
export async function cfRevokeCertificate(certificateId, reason) {
  return callFunction('revokeCertificate', { certificateId, reason });
}

// ============================================
// QUIZ FUNCTIONS
// ============================================

/**
 * Soumet un quiz (correction et scoring cote serveur).
 * SECURITE : Le score est calcule uniquement par le serveur.
 */
export async function cfSubmitQuiz(quizId, attemptId, answers) {
  return callFunction('submitQuiz', { quizId, attemptId, answers });
}

// ============================================
// TUTOR AI PROXY
// ============================================

/**
 * Appelle l'IA via le proxy securise.
 * SECURITE : Les cles API ne sont jamais exposees au client.
 */
export async function cfTutorProxy(message, cefrLevel = 'A1', context = '', provider = 'openai', messageType = 'text') {
  return callFunction('tutorProxy', { message, cefrLevel, context, provider, messageType });
}

// ============================================
// HEALTH CHECK
// ============================================

export async function cfHealthCheck() {
  return callFunction('health', {});
}

// ============================================
// EXPORT DEFAULT
// ============================================

export const cloudFunctionService = {
  auth: { createUserProfile: cfCreateUserProfile, assignRole: cfAssignRole, deleteUserData: cfDeleteUserData, syncUserClaims: cfSyncUserClaims },
  payment: { validatePayment: cfValidatePayment },
  certificate: { generateCertificate: cfGenerateCertificate, revokeCertificate: cfRevokeCertificate },
  quiz: { submitQuiz: cfSubmitQuiz },
  tutor: { proxy: cfTutorProxy },
  health: cfHealthCheck
};
