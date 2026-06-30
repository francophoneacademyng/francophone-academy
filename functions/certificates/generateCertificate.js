/**
 * generateCertificate.js
 * Generation securisee de certificats cote serveur.
 * Le navigateur ne peut JAMAIS creer un certificat directement.
 */

const { db, COLLECTIONS } = require('../config/firebaseAdmin');
const { logCertificate, logSecurity, logError } = require('../shared/logger');
const { isValidUid, isValidCEFR, sanitizeString } = require('../shared/validators');
const { checkCertificateConditions } = require('./checkConditions');

const CERTIFICATE_STATUS = { ACTIVE: 'active', REVOKED: 'revoked', EXPIRED: 'expired', PENDING: 'pending' };
const CEFR_LEVELS = { A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2', C1: 'C1', C2: 'C2' };

/**
 * Genere un numero de certificat unique.
 */
function generateNumber(cefrLevel) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `FA-${cefrLevel}-${year}${month}-${seq}`;
}

/**
 * Determine la mention.
 */
function getGradeLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Tres bien';
  if (score >= 70) return 'Bien';
  if (score >= 60) return 'Assez bien';
  if (score >= 50) return 'Passable';
  return 'Non valide';
}

/**
 * Genere un certificat (UNIQUEMENT si toutes les conditions sont remplies).
 */
async function generateCertificateHandler(data, context) {
  // 1. Auth requise
  if (!context.auth) {
    await logSecurity('certificate_noAuth', '', data);
    throw new Error('Authentification requise');
  }

  const userId = context.auth.uid;
  const { courseId, courseTitle, courseLevel, cefrLevel } = data;

  if (!isValidUid(userId) || !courseId || !isValidCEFR(cefrLevel)) {
    await logSecurity('certificate_invalidData', userId, data);
    throw new Error('Donnees invalides');
  }

  try {
    // 2. Verifier l'eligibilite (conditions serveur)
    const { eligible, conditions, score, quizScores } = await checkCertificateConditions(userId, courseId, cefrLevel);

    if (!eligible) {
      const failedConditions = Object.entries(conditions)
        .filter(([, v]) => !v.met)
        .map(([, v]) => v.detail);
      await logSecurity('certificate_notEligible', userId, { courseId, failedConditions });
      throw new Error(`Non eligible: ${failedConditions.join(', ')}`);
    }

    // 3. Verifier si un certificat existe deja
    const certId = `cert_${userId}_${courseId}`;
    const existingRef = db.collection(COLLECTIONS.CERTIFICATES).doc(certId);
    const existingDoc = await existingRef.get();

    if (existingDoc.exists) {
      const existing = existingDoc.data();
      if (existing.status === CERTIFICATE_STATUS.ACTIVE) {
        await logCertificate('certificate_alreadyExists', userId, { certId });
        return { certificate: existing, isNew: false };
      }
    }

    // 4. Charger les infos utilisateur
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // 5. Charger les heures d'etude
    const progressDoc = await db.collection(COLLECTIONS.STUDENT_PROGRESS).doc(userId).get();
    const learningHours = progressDoc.exists
      ? Math.round((progressDoc.data().totalStudyMinutes || 0) / 60)
      : 0;

    // 6. Generer le certificat
    const now = new Date().toISOString();
    const certificateNumber = generateNumber(cefrLevel);
    const gradeLabel = getGradeLabel(score);

    const certificate = {
      id: certId,
      certificateNumber,
      userId,
      userName: sanitizeString(userData.displayName || ''),
      userEmail: userData.email || '',
      courseId,
      courseTitle: sanitizeString(courseTitle || ''),
      courseLevel: courseLevel || '',
      cefrLevel,
      score,
      finalGrade: score >= 60 ? 'D' : 'F',
      gradeLabel,
      completionDate: now,
      issueDate: now,
      status: CERTIFICATE_STATUS.ACTIVE,
      issuer: 'Francophone Academy',
      verificationUrl: `https://francophone.academy/verify-certificate?number=${certificateNumber}`,
      downloadCount: 0,
      verificationCount: 0,
      skills: getSkillsForLevel(cefrLevel),
      quizScores,
      learningHours,
      createdAt: now,
      updatedAt: now
    };

    // 7. Sauvegarder
    await existingRef.set(certificate);

    await logCertificate('certificate_generated', userId, {
      certificateNumber, courseId, cefrLevel, score
    });

    return { certificate, isNew: true };

  } catch (err) {
    await logError('certificate_generation', userId, err, 'critical');
    throw err;
  }
}

/**
 * Revoke un certificat (admin uniquement).
 */
async function revokeCertificateHandler(data, context) {
  if (!context.auth) throw new Error('Authentification requise');

  const callerDoc = await db.collection(COLLECTIONS.USERS).doc(context.auth.uid).get();
  if (!callerDoc.exists || !['admin', 'superadmin'].includes(callerDoc.data().role)) {
    throw new Error('Acces reserve aux administrateurs');
  }

  const { certificateId, reason } = data;
  const certRef = db.collection(COLLECTIONS.CERTIFICATES).doc(certificateId);
  const certDoc = await certRef.get();

  if (!certDoc.exists) throw new Error('Certificat introuvable');

  const now = new Date().toISOString();
  await certRef.update({
    status: CERTIFICATE_STATUS.REVOKED,
    revokedAt: now,
    revokeReason: sanitizeString(reason || ''),
    updatedAt: now
  });

  await logCertificate('certificate_revoked', context.auth.uid, { certificateId, reason });
  return { success: true };
}

function getSkillsForLevel(level) {
  const skillsByLevel = {
    A1: ['Salutations', 'Presentation', 'Nombres', 'Articles'],
    A2: ['Passe compose', 'Vocabulaire quotidien', 'Expressions idiomatiques'],
    B1: ['Subjonctif', 'Conditionnel', 'Connecteurs logiques'],
    B2: ['Discours indirect', 'Figures de style', 'Registres de langue'],
    C1: ['Gerondif', 'Ne expletive', 'Analyse stylistique'],
    C2: ['Analyse litteraire', 'Sociolinguistique', 'Stylistique avancee']
  };
  return skillsByLevel[level] || [];
}

module.exports = { generateCertificateHandler, revokeCertificateHandler, generateNumber };
