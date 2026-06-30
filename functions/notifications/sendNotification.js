/**
 * sendNotification.js
 * Systeme de notifications automatiques.
 * Triggers : nouvel utilisateur, paiement, certificat, quiz, rappels.
 */

const { db, COLLECTIONS } = require('../config/firebaseAdmin');
const { log } = require('../shared/logger');

const NOTIFICATION_TYPES = {
  NEW_USER: 'new_user',
  SUBSCRIPTION_ACTIVATED: 'subscription_activated',
  CERTIFICATE_EARNED: 'certificate_earned',
  QUIZ_COMPLETED: 'quiz_completed',
  COURSE_REMINDER: 'course_reminder',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  STREAK_REMINDER: 'streak_reminder',
  ADMIN_ALERT: 'admin_alert'
};

/**
 * Cree une notification dans Firestore.
 */
async function createNotification(userId, type, title, message, data = {}) {
  const now = new Date().toISOString();
  const notifRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc();

  await notifRef.set({
    userId,
    type,
    title,
    message,
    data,
    read: false,
    createdAt: now,
    updatedAt: now
  });

  await log('notification', type, userId, { title });
  return notifRef.id;
}

// ============================================
// TRIGGERS
// ============================================

/**
 * Nouvel utilisateur inscrit.
 */
async function onNewUser(userId, userData) {
  // Notification pour l'utilisateur
  await createNotification(userId, NOTIFICATION_TYPES.NEW_USER,
    'Bienvenue sur Francophone Academy !',
    `Bonjour ${userData.displayName || ''}, votre compte a ete cree avec succes. Commencez votre parcours d'apprentissage !`,
    { onboardingStep: 1 }
  );

  // Notification pour les admins
  const admins = await db.collection(COLLECTIONS.USERS)
    .where('role', 'in', ['admin', 'superadmin'])
    .get();

  admins.docs.forEach(async admin => {
    await createNotification(admin.id, NOTIFICATION_TYPES.NEW_USER,
      'Nouvel utilisateur inscrit',
      `${userData.displayName || 'Un utilisateur'} vient de s'inscrire.`,
      { newUserId: userId }
    );
  });
}

/**
 * Abonnement active.
 */
async function onSubscriptionActivated(userId, plan, amount) {
  await createNotification(userId, NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED,
    'Abonnement active !',
    `Votre abonnement ${plan} est maintenant actif. Vous avez paye ${amount} XOF. Bon apprentissage !`,
    { plan, amount }
  );
}

/**
 * Certificat obtenu.
 */
async function onCertificateEarned(userId, certificateData) {
  await createNotification(userId, NOTIFICATION_TYPES.CERTIFICATE_EARNED,
    '🎓 Certificat obtenu !',
    `Felicitations ! Vous avez obtenu votre certificat pour ${certificateData.courseTitle} avec un score de ${certificateData.score}%.`,
    certificateData
  );
}

/**
 * Quiz termine.
 */
async function onQuizCompleted(userId, quizTitle, score, isPassing) {
  const title = isPassing ? '✅ Quiz reussi !' : '📝 Quiz termine';
  const message = isPassing
    ? `Felicitations ! Vous avez reussi le quiz "${quizTitle}" avec ${score}%.`
    : `Vous avez termine le quiz "${quizTitle}" avec ${score}%. Continuez a pratiquer !`;

  await createNotification(userId, NOTIFICATION_TYPES.QUIZ_COMPLETED, title, message,
    { quizTitle, score, isPassing }
  );
}

/**
 * Paiement reussi.
 */
async function onPaymentSuccess(userId, plan, amount) {
  await createNotification(userId, NOTIFICATION_TYPES.PAYMENT_SUCCESS,
    '✅ Paiement confirme',
    `Votre paiement de ${amount} XOF pour le plan ${plan} a ete confirme.`,
    { plan, amount }
  );
}

/**
 * Paiement echoue.
 */
async function onPaymentFailed(userId, plan, reason) {
  await createNotification(userId, NOTIFICATION_TYPES.PAYMENT_FAILED,
    '❌ Paiement non abouti',
    `Votre paiement pour le plan ${plan} n'a pas pu etre traite. ${reason || 'Veuillez reessayer.'}`,
    { plan, reason }
  );
}

/**
 * Rappel de reprise de cours (appel par Cloud Scheduler).
 */
async function onCourseReminder(userId, courseTitle, lastStudyDate) {
  const daysSince = lastStudyDate
    ? Math.floor((Date.now() - new Date(lastStudyDate).getTime()) / (1000 * 60 * 60 * 24))
    : 7;

  await createNotification(userId, NOTIFICATION_TYPES.COURSE_REMINDER,
    '📚 Reprenez votre apprentissage !',
    `Il s'est ecoule ${daysSince} jour(s) depuis votre derniere session sur "${courseTitle}". Ne perdez pas votre serie !`,
    { courseTitle, daysSince }
  );
}

/**
 * Rappel de streak.
 */
async function onStreakReminder(userId, streak) {
 await createNotification(userId, NOTIFICATION_TYPES.STREAK_REMINDER,
    '🔥 Votre serie est en danger !',
    `Vous avez une serie de ${streak} jours ! Connectez-vous aujourd'hui pour la maintenir.`,
    { streak }
  );
}

module.exports = {
  createNotification,
  onNewUser,
  onSubscriptionActivated,
  onCertificateEarned,
  onQuizCompleted,
  onPaymentSuccess,
  onPaymentFailed,
  onCourseReminder,
  onStreakReminder,
  NOTIFICATION_TYPES
};
