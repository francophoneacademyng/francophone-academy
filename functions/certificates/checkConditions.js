/**
 * checkConditions.js
 * Verification serveur des conditions d'obtention d'un certificat.
 * Le client ne peut JAMAIS forcer la generation d'un certificat.
 */

const { db, COLLECTIONS } = require('../config/firebaseAdmin');
const { logCertificate, logSecurity } = require('../shared/logger');
const { isValidUid, isValidCEFR } = require('../shared/validators');

const PLAN_FEATURES = {
  free: { certificates: false },
  standard: { certificates: true },
  professional: { certificates: true },
  enterprise: { certificates: true }
};

/**
 * Verifie toutes les conditions d'eligibilite.
 * Retourne un resultat detaille avec chaque condition.
 */
async function checkCertificateConditions(userId, courseId, cefrLevel) {
  if (!isValidUid(userId)) throw new Error('userId invalide');
  if (!isValidCEFR(cefrLevel)) throw new Error('niveau CECRL invalide');

  const conditions = {
    enrollment: { met: false, detail: '' },
    lessonsComplete: { met: false, detail: '' },
    quizzesPassed: { met: false, detail: '' },
    subscription: { met: false, detail: '' },
    score: { met: false, detail: '' }
  };

  let overallScore = 0;
  let quizScores = [];

  // 1. Verifier l'inscription
  const enrollmentSnapshot = await db.collection(COLLECTIONS.ENROLLMENTS)
    .where('userId', '==', userId)
    .where('courseId', '==', courseId)
    .limit(1)
    .get();

  if (enrollmentSnapshot.empty) {
    conditions.enrollment = { met: false, detail: 'Non inscrit au cours' };
    return { eligible: false, conditions, score: 0, quizScores: [] };
  }

  const enrollment = enrollmentSnapshot.docs[0].data();
  conditions.enrollment = { met: true, detail: 'Inscrit' };

  // 2. Verifier la progression (toutes les lecons)
  const progress = enrollment.progress || 0;
  const lessonsCompleted = enrollment.completedLessons?.length || 0;
  const totalLessons = enrollment.totalLessons || 1;

  if (progress >= 100 && lessonsCompleted >= totalLessons) {
    conditions.lessonsComplete = { met: true, detail: `100% complete (${lessonsCompleted}/${totalLessons} lecons)` };
  } else {
    conditions.lessonsComplete = { met: false, detail: `${Math.round(progress)}% complete (${lessonsCompleted}/${totalLessons} lecons, 100% requis)` };
  }

  // 3. Verifier les quiz
  const resultsSnapshot = await db.collection(COLLECTIONS.QUIZ_RESULTS)
    .where('userId', '==', userId)
    .where('level', '==', cefrLevel)
    .get();

  quizScores = resultsSnapshot.docs.map(d => ({
    quizTitle: d.data().quizTitle || 'Quiz',
    score: d.data().percentage || 0,
    maxScore: 100,
    isPassing: (d.data().percentage || 0) >= 60
  }));

  const passingQuizzes = quizScores.filter(q => q.isPassing);
  if (passingQuizzes.length > 0) {
    conditions.quizzesPassed = { met: true, detail: `${passingQuizzes.length} quiz(s) reussi(s)` };
  } else {
    conditions.quizzesPassed = { met: false, detail: 'Aucun quiz reussi (minimum 60% requis)' };
  }

  // 4. Calculer le score global
  overallScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((s, q) => s + q.score, 0) / quizScores.length)
    : Math.round(progress);

  if (overallScore >= 60) {
    conditions.score = { met: true, detail: `Score: ${overallScore}%` };
  } else {
    conditions.score = { met: false, detail: `Score: ${overallScore}% (minimum 60%)` };
  }

  // 5. Verifier l'abonnement
  const subSnapshot = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
    .where('userId', '==', userId)
    .where('status', 'in', ['active', 'trial'])
    .limit(1)
    .get();

  if (!subSnapshot.empty) {
    const plan = subSnapshot.docs[0].data().plan || 'free';
    const planConfig = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
    if (planConfig.certificates) {
      conditions.subscription = { met: true, detail: `Plan ${plan} (certificats inclus)` };
    } else {
      conditions.subscription = { met: false, detail: `Plan ${plan} — Standard ou superieur requis` };
    }
  } else {
    conditions.subscription = { met: false, detail: 'Aucun abonnement actif' };
  }

  // Determiner l'eligibilite globale
  const eligible = Object.values(conditions).every(c => c.met);

  await logCertificate('checkConditions', userId, {
    courseId, cefrLevel, eligible, score: overallScore
  });

  return { eligible, conditions, score: overallScore, quizScores };
}

module.exports = { checkCertificateConditions };
