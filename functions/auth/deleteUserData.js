/**
 * deleteUserData.js
 * Supprime toutes les donnees d'un utilisateur (RGPD).
 * Trigger : on user delete (Firebase Auth).
 */

const { db, COLLECTIONS } = require('../config/firebaseAdmin');
const { logAuth, logError } = require('../shared/logger');

/**
 * Supprime toutes les donnees d'un utilisateur.
 * Appele automatiquement lors de la suppression du compte Auth.
 */
async function deleteUserDataHandler(user) {
  const uid = user.uid;

  try {
    const batch = db.batch();
    const collectionsToClean = [
      COLLECTIONS.USERS,
      COLLECTIONS.STUDENT_PROGRESS,
      COLLECTIONS.SUBSCRIPTIONS,
      COLLECTIONS.PAYMENTS,
      COLLECTIONS.TRANSACTIONS,
      COLLECTIONS.INVOICES,
      COLLECTIONS.CERTIFICATES,
      COLLECTIONS.QUIZ_ATTEMPTS,
      COLLECTIONS.QUIZ_RESULTS,
      COLLECTIONS.STUDENT_SCORES,
      COLLECTIONS.TUTOR_MEMORY,
      COLLECTIONS.CHAT_SESSIONS,
      COLLECTIONS.CHAT_MESSAGES,
      COLLECTIONS.ENROLLMENTS
    ];

    for (const collection of collectionsToClean) {
      const snapshot = await db.collection(collection).where('userId', '==', uid).get();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }

    await batch.commit();
    await logAuth('deleteUserData', uid, { collectionsCleaned: collectionsToClean.length });

    return { success: true };

  } catch (err) {
    await logError('deleteUserData', uid, err, 'critical');
    throw err;
  }
}

/**
 * HTTPS Callable : suppression manuelle (admin ou proprietaire).
 */
async function deleteUserDataCallable(data, context) {
  if (!context.auth) throw new Error('Non authentifie');

  const callerUid = context.auth.uid;
  const { userId } = data;

  // Seul l'admin ou le proprietaire peut supprimer
  const callerDoc = await db.collection(COLLECTIONS.USERS).doc(callerUid).get();
  const isAdmin = callerDoc.exists && ['admin', 'superadmin'].includes(callerDoc.data().role);
  const isOwner = callerUid === userId;

  if (!isAdmin && !isOwner) {
    throw new Error('Acces refuse');
  }

  // Supprimer Auth puis donnees
  const { auth } = require('../config/firebaseAdmin');
  await auth.deleteUser(userId);
  await deleteUserDataHandler({ uid: userId });

  return { success: true };
}

module.exports = { deleteUserDataHandler, deleteUserDataCallable };
