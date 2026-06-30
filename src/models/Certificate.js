/**
 * Certificate.js
 * Modele de domaine pour un certificat numerique.
 * Represente la structure de la collection Firestore : certificates/{certificateId}
 */

import { CEFR_LEVELS } from '../config/firebase.js';

export const CERTIFICATE_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
  PENDING: 'pending'
};

export class Certificate {
  constructor(data = {}) {
    this.id = data.id || '';
    this.certificateNumber = data.certificateNumber || '';
    this.userId = data.userId || '';
    this.userName = data.userName || '';
    this.userEmail = data.userEmail || '';
    this.courseId = data.courseId || '';
    this.courseTitle = data.courseTitle || '';
    this.courseLevel = data.courseLevel || '';
    this.cefrLevel = data.cefrLevel || CEFR_LEVELS.A1;
    this.score = data.score || 0;
    this.finalGrade = data.finalGrade || '';
    this.gradeLabel = data.gradeLabel || '';
    this.completionDate = data.completionDate || new Date().toISOString();
    this.issueDate = data.issueDate || new Date().toISOString();
    this.expiryDate = data.expiryDate || null;
    this.status = data.status || CERTIFICATE_STATUS.ACTIVE;
    this.issuer = data.issuer || 'Francophone Academy';
    this.issuerSignature = data.issuerSignature || '';
    this.qrCodeDataUrl = data.qrCodeDataUrl || '';
    this.verificationUrl = data.verificationUrl || '';
    this.downloadCount = data.downloadCount || 0;
    this.verificationCount = data.verificationCount || 0;
    this.revokedAt = data.revokedAt || null;
    this.revokeReason = data.revokeReason || '';
    this.skills = data.skills || []; // competences acquises
    this.quizScores = data.quizScores || []; // [{quizTitle, score, maxScore}]
    this.learningHours = data.learningHours || 0;
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Genere un numero de certificat unique.
   * Format : FA-CECRL-ANNEE-MOIS-SEQUENCE
   */
  static generateNumber(cefrLevel = 'A1') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sequence = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `FA-${cefrLevel}-${year}${month}-${sequence}`;
  }

  /**
   * Cree un certificat depuis les resultats d'un parcours.
   */
  static createFromCompletion(userId, userName, userEmail, courseId, courseTitle, courseLevel, cefrLevel, score, quizScores = [], learningHours = 0) {
    const number = Certificate.generateNumber(cefrLevel);
    const now = new Date();
    const gradeLabel = Certificate.getGradeLabel(score);
    const finalGrade = Certificate.getGrade(score);

    return new Certificate({
      id: `cert_${userId}_${courseId}`,
      certificateNumber: number,
      userId,
      userName,
      userEmail,
      courseId,
      courseTitle,
      courseLevel,
      cefrLevel,
      score,
      finalGrade,
      gradeLabel,
      completionDate: now.toISOString(),
      issueDate: now.toISOString(),
      status: CERTIFICATE_STATUS.ACTIVE,
      quizScores,
      learningHours,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
  }

  static fromFirestore(id, data) {
    return new Certificate({ ...data, id });
  }

  toFirestore() {
    return {
      certificateNumber: this.certificateNumber,
      userId: this.userId,
      userName: this.userName,
      userEmail: this.userEmail,
      courseId: this.courseId,
      courseTitle: this.courseTitle,
      courseLevel: this.courseLevel,
      cefrLevel: this.cefrLevel,
      score: this.score,
      finalGrade: this.finalGrade,
      gradeLabel: this.gradeLabel,
      completionDate: this.completionDate,
      issueDate: this.issueDate,
      expiryDate: this.expiryDate,
      status: this.status,
      issuer: this.issuer,
      issuerSignature: this.issuerSignature,
      qrCodeDataUrl: this.qrCodeDataUrl,
      verificationUrl: this.verificationUrl,
      downloadCount: this.downloadCount,
      verificationCount: this.verificationCount,
      revokedAt: this.revokedAt,
      revokeReason: this.revokeReason,
      skills: this.skills,
      quizScores: this.quizScores,
      learningHours: this.learningHours,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Genere l'URL publique de verification.
   * @param {string} baseUrl
   */
  generateVerificationUrl(baseUrl) {
    this.verificationUrl = `${baseUrl}/pages/verify-certificate/verify-certificate.html?number=${this.certificateNumber}`;
    return this.verificationUrl;
  }

  /**
   * Incremente le compteur de telechargements.
   */
  incrementDownloads() {
    this.downloadCount++;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Incremente le compteur de verifications.
   */
  incrementVerifications() {
    this.verificationCount++;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Revoke le certificat.
   */
  revoke(reason = '') {
    this.status = CERTIFICATE_STATUS.REVOKED;
    this.revokedAt = new Date().toISOString();
    this.revokeReason = reason;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Verifie si le certificat est valide.
   */
  isValid() {
    if (this.status !== CERTIFICATE_STATUS.ACTIVE) return false;
    if (this.expiryDate && new Date(this.expiryDate) < new Date()) {
      this.status = CERTIFICATE_STATUS.EXPIRED;
      return false;
    }
    return true;
  }

  // ============================================
  // GRADES
  // ============================================

  static getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    if (score >= 50) return 'E';
    return 'F';
  }

  static getGradeLabel(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Tres bien';
    if (score >= 70) return 'Bien';
    if (score >= 60) return 'Assez bien';
    if (score >= 50) return 'Passable';
    return 'Non valide';
  }

  // ============================================
  // FORMATS
  // ============================================

  toDashboardFormat() {
    return {
      id: this.id,
      certificateNumber: this.certificateNumber,
      courseTitle: this.courseTitle,
      cefrLevel: this.cefrLevel,
      score: this.score,
      grade: this.gradeLabel,
      issueDate: this.issueDate,
      isValid: this.isValid(),
      downloadCount: this.downloadCount,
      verificationCount: this.verificationCount
    };
  }

  toVerificationFormat() {
    return {
      certificateNumber: this.certificateNumber,
      holderName: this.userName,
      courseTitle: this.courseTitle,
      cefrLevel: this.cefrLevel,
      score: this.score,
      grade: this.gradeLabel,
      issueDate: this.issueDate,
      completionDate: this.completionDate,
      status: this.status,
      issuer: this.issuer,
      isValid: this.isValid()
    };
  }
}
