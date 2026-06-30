/**
 * updateClaims.js
 * Met a jour les Custom Claims Firebase Auth.
 * Les Claims sont utilises par les Firestore Rules pour la securite.
 */

const { auth, db, COLLECTIONS } = require('../config/firebaseAdmin');
const { logAuth } = require('../shared/logger');

/**
 * Synchronise les Custom Claims avec le profil Firestore.
 * A appeler apres tout changement de role ou d'abonnement.
 */
async function syncUserClaims(userId) {
  const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
  if (!userDoc.exists) return { success: false, error: 'Profil introuvable' };

  const userData = userDoc.data();
  const claims = {
    role: userData.role || 'student',
    plan: userData.subscriptionPlan || 'free',
    level: userData.level || 'A1'
  };

  await auth.setCustomUserClaims(userId, claims);
  await logAuth('syncClaims', userId, claims);

  return { success: true, claims };
}

/**
 * HTTPS Callable : synchroniser les claims (admin).
 */
async function syncUserClaimsCallable(data, context) {
  if (!context.auth) throw new Error('Non authentifie');

  const callerDoc = await db.collection(COLLECTIONS.USERS).doc(context.auth.uid).get();
  if (!callerDoc.exists || !['admin', 'superadmin'].includes(callerDoc.data().role)) {
    throw new Error('Acces reserve aux administrateurs');
  }

  const { userId } = data;
  return syncUserClaims(userId);
}

module.exports = { syncUserClaims, syncUserClaimsCallable };
