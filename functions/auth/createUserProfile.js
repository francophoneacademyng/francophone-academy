/**
 * createUserProfile.js
 * Cree automatiquement le profil utilisateur et la progression
 * lors de l'inscription via Firebase Auth trigger.
 */

const { db, COLLECTIONS, ROLES } = require('../config/firebaseAdmin');
const { logAuth, logError } = require('../shared/logger');
const { isValidEmail, sanitizeString } = require('../shared/validators');

/**
 * Cloud Function trigger : on user create (Firebase Auth).
 * Cree le profil Firestore et la progression par defaut.
 */
async function createUserProfileHandler(user) {
  const uid = user.uid;
  const email = user.email || '';
  const displayName = sanitizeString(user.displayName || '');
  const photoURL = user.photoURL || '';

  try {
    const now = new Date().toISOString();
    const batch = db.batch();

    // 1. Profil utilisateur
    const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
    batch.set(userRef, {
      uid,
      email: email.toLowerCase(),
      displayName,
      photoURL,
      role: ROLES.STUDENT,
      level: 'A1',
      isActive: true,
      subscriptionPlan: 'free',
      createdAt: now,
      updatedAt: now
    });

    // 2. Progression etudiant
    const progressRef = db.collection(COLLECTIONS.STUDENT_PROGRESS).doc(uid);
    batch.set(progressRef, {
      userId: uid,
      level: 'A1',
      xp: 0,
      streak: 0,
      maxStreak: 0,
      totalStudyMinutes: 0,
      lessonsCompleted: 0,
      quizzesTaken: 0,
      quizAverage: 0,
      lastStudyDate: null,
      createdAt: now,
      updatedAt: now
    });

    // 3. Abonnement gratuit
    const subRef = db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(`sub_${uid}_free`);
    batch.set(subRef, {
      userId: uid,
      plan: 'free',
      status: 'active',
      price: 0,
      currency: 'XOF',
      startDate: now,
      features: ['1 cours gratuit', '30 min IA Tutor/mois', '5 quiz/mois', 'Progression de base'],
      createdAt: now,
      updatedAt: now
    });

    await batch.commit();
    await logAuth('createUserProfile', uid, { displayName, email });

    return { success: true };

  } catch (err) {
    await logError('createUserProfile', uid, err, 'critical');
    throw new Error(`Echec creation profil: ${err.message}`);
  }
}

/**
 * HTTPS Callable : creation manuelle (admin).
 */
async function createUserProfileCallable(data, context) {
  // Verifier auth admin
  if (!context.auth) throw new Error('Non authentifie');
  const caller = await db.collection(COLLECTIONS.USERS).doc(context.auth.uid).get();
  if (!caller.exists || !['admin', 'superadmin'].includes(caller.data().role)) {
    throw new Error('Acces refuse');
  }

  const { email, password, displayName, role = 'student' } = data;
  if (!isValidEmail(email)) throw new Error('Email invalide');

  // Creer via Firebase Auth
  const { auth } = require('../config/firebaseAdmin');
  const userRecord = await auth.createUser({ email, password, displayName });
  await createUserProfileHandler(userRecord);

  // Mettre a jour le role si different de student
  if (role !== 'student') {
    await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).update({ role });
  }

  return { uid: userRecord.uid, success: true };
}

module.exports = { createUserProfileHandler, createUserProfileCallable };
