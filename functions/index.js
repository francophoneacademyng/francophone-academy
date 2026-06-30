/**
 * index.js
 * Point d'entree des Cloud Functions Firebase.
 * Toutes les fonctions sont exportees ici pour le deploiement.
 *
 * Deploiement :
 *   firebase deploy --only functions
 *   firebase deploy --only functions:auth,functions:payments
 */

const functions = require('firebase-functions');
const { admin } = require('./config/firebaseAdmin');

// ============================================
// AUTH
// ============================================
const { createUserProfileHandler, createUserProfileCallable } = require('./auth/createUserProfile');
const { assignRoleCallable } = require('./auth/assignDefaultRole');
const { deleteUserDataHandler, deleteUserDataCallable } = require('./auth/deleteUserData');
const { syncUserClaimsCallable } = require('./auth/updateClaims');

// ============================================
// PAYMENTS
// ============================================
const { processPaymentValidation } = require('./payments/validatePaystack');

// ============================================
// CERTIFICATES
// ============================================
const { generateCertificateHandler, revokeCertificateHandler } = require('./certificates/generateCertificate');

// ============================================
// QUIZ
// ============================================
const { submitQuizHandler } = require('./quiz/finalCorrection');

// ============================================
// TUTOR
// ============================================
const { tutorProxyHandler } = require('./tutor/aiProxy');

// ============================================
// NOTIFICATIONS
// ============================================
const {
  onNewUser, onSubscriptionActivated, onCertificateEarned,
  onQuizCompleted, onPaymentSuccess, onPaymentFailed,
  onCourseReminder, onStreakReminder
} = require('./notifications/sendNotification');

// ============================================
// EXPORTS — FIREBASE FUNCTIONS
// ============================================

// ---- AUTH TRIGGERS ----

/**
 * Trigger : creation d'un utilisateur Firebase Auth.
 * Cree automatiquement le profil, la progression et l'abonnement gratuit.
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  await createUserProfileHandler(user);
  await onNewUser(user.uid, { displayName: user.displayName, email: user.email });
});

/**
 * Trigger : suppression d'un utilisateur Firebase Auth.
 * Supprime toutes les donnees associees (RGPD).
 */
exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
  await deleteUserDataHandler(user);
});

// ---- AUTH CALLABLES ----

exports.createUserProfile = functions.https.onCall(async (data, context) => {
  return createUserProfileCallable(data, context);
});

exports.assignRole = functions.https.onCall(async (data, context) => {
  return assignRoleCallable(data, context);
});

exports.deleteUserData = functions.https.onCall(async (data, context) => {
  return deleteUserDataCallable(data, context);
});

exports.syncUserClaims = functions.https.onCall(async (data, context) => {
  return syncUserClaimsCallable(data, context);
});

// ---- PAYMENTS ----

/**
 * Callable : valider un paiement Paystack et activer l'abonnement.
 * SECURITE : Seule la Cloud Function peut valider les paiements.
 */
exports.validatePayment = functions.https.onCall(async (data, context) => {
  const result = await processPaymentValidation(data, context);
  if (result.success) {
    await onSubscriptionActivated(context.auth.uid, result.plan, result.amount);
    await onPaymentSuccess(context.auth.uid, result.plan, result.amount);
  }
  return result;
});

// ---- CERTIFICATES ----

/**
 * Callable : generer un certificat (verification des conditions cote serveur).
 * SECURITE : Le client ne peut pas forcer la generation.
 */
exports.generateCertificate = functions.https.onCall(async (data, context) => {
  const result = await generateCertificateHandler(data, context);
  if (result.certificate && result.isNew) {
    await onCertificateEarned(context.auth.uid, result.certificate);
  }
  return result;
});

/**
 * Callable : revoquer un certificat (admin uniquement).
 */
exports.revokeCertificate = functions.https.onCall(async (data, context) => {
  return revokeCertificateHandler(data, context);
});

// ---- QUIZ ----

/**
 * Callable : soumettre un quiz (correction et scoring cote serveur).
 * SECURITE : Le score est calcule uniquement cote serveur.
 */
exports.submitQuiz = functions.https.onCall(async (data, context) => {
  const result = await submitQuizHandler(data, context);
  await onQuizCompleted(context.auth.uid, result.result?.quizTitle, result.percentage, result.isPassing);
  return result;
});

// ---- TUTOR AI PROXY ----

/**
 * Callable : proxy pour les appels IA.
 * SECURITE : Les cles API ne sont JAMAIS exposees au client.
 */
exports.tutorProxy = functions.https.onCall(async (data, context) => {
  return tutorProxyHandler(data, context);
});

// ---- NOTIFICATIONS ----

/**
 * Scheduled : rappels quotidiens (Cloud Scheduler).
 * Envoie des notifications aux utilisateurs inactifs.
 */
exports.dailyReminders = functions.pubsub.schedule('0 9 * * *')
  .timeZone('Africa/Abidjan')
  .onRun(async (context) => {
    const { db, COLLECTIONS } = require('./config/firebaseAdmin');

    // Trouver les utilisateurs inactifs depuis 3 jours
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const inactiveUsers = await db.collection(COLLECTIONS.STUDENT_PROGRESS)
      .where('lastStudyDate', '<', threeDaysAgo.toISOString())
      .limit(100)
      .get();

    for (const doc of inactiveUsers.docs) {
      const data = doc.data();
      if (data.streak > 0) {
        await onStreakReminder(data.userId, data.streak);
      }
    }

    return { notified: inactiveUsers.size };
  });

/**
 * HTTP : webhook pour les evenements Paystack (optionnel).
 */
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const event = req.body;

  try {
    if (event.event === 'charge.success') {
      const { reference } = event.data;
      // Le paiement est deja traite par validatePayment
      // Cette route peut etre utilisee pour des synchronisations supplementaires
    }
    res.status(200).send('OK');
  } catch (err) {
    res.status(500).send('Error');
  }
});

// ============================================
// HEALTH CHECK
// ============================================

/**
 * HTTP : endpoint de sante pour le monitoring.
 */
exports.health = functions.https.onRequest(async (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    functions: [
      'onUserCreated', 'onUserDeleted',
      'createUserProfile', 'assignRole', 'deleteUserData', 'syncUserClaims',
      'validatePayment', 'generateCertificate', 'revokeCertificate',
      'submitQuiz', 'tutorProxy', 'dailyReminders'
    ]
  });
});
