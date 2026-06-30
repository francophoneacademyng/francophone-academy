/**
 * assignDefaultRole.js
 * Assigne les roles et Custom Claims Firebase.
 */

const { auth, db, COLLECTIONS, ROLES } = require('../config/firebaseAdmin');
const { logAuth, logSecurity } = require('../shared/logger');

/**
 * Assigne un role a un utilisateur (Firestore + Auth Claims).
 */
async function assignRole(userId, role) {
  const validRoles = Object.values(ROLES);
  if (!validRoles.includes(role)) throw new Error(`Role invalide: ${role}`);

  const batch = db.batch();

  // Mettre a jour Firestore
  const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
  batch.update(userRef, { role, updatedAt: new Date().toISOString() });

  await batch.commit();

  // Mettre a jour les Custom Claims (pour les Firestore Rules)
  await auth.setCustomUserClaims(userId, { role });

  await logAuth('assignRole', userId, { role });
  return { success: true, role };
}

/**
 * HTTPS Callable : assigner un role (admin uniquement).
 */
async function assignRoleCallable(data, context) {
  if (!context.auth) throw new Error('Non authentifie');

  const callerUid = context.auth.uid;
  const callerDoc = await db.collection(COLLECTIONS.USERS).doc(callerUid).get();
  if (!callerDoc.exists || !['admin', 'superadmin'].includes(callerDoc.data().role)) {
    await logSecurity('assignRole_unauthorized', callerUid, { targetUser: data.userId });
    throw new Error('Acces reserve aux administrateurs');
  }

  const { userId, role } = data;
  return assignRole(userId, role);
}

/**
 * Renvoie les Custom Claims d'un utilisateur.
 */
async function getUserClaims(userId) {
  const user = await auth.getUser(userId);
  return user.customClaims || {};
}

module.exports = { assignRole, assignRoleCallable, getUserClaims };
