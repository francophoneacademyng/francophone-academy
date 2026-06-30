/**
 * CertificateService.js
 * Moteur de certificats numeriques.
 * Generation, verification, PDF, QR Code.
 *
 * Controller -> CertificateService -> CertificateRepository + EnrollmentRepository + QuizResultRepository
 */

import { CertificateRepository } from '../repositories/CertificateRepository.js';
import { Certificate, CERTIFICATE_STATUS } from '../models/Certificate.js';
import { EnrollmentRepository } from '../repositories/EnrollmentRepository.js';
import { QuizResultRepository } from '../repositories/AssessmentRepository.js';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository.js';
import { StudentProgressRepository } from '../repositories/StudentProgressRepository.js';
import { translateFirebaseError } from '../utils/firebaseErrors.js';
import { CEFR_LEVELS } from '../config/firebase.js';

export class CertificateService {
  constructor() {
    this.certRepo = new CertificateRepository();
    this.enrollRepo = new EnrollmentRepository();
    this.resultRepo = new QuizResultRepository();
    this.subRepo = new SubscriptionRepository();
    this.progressRepo = new StudentProgressRepository();
  }

  // ============================================
  // VERIFICATION DES CONDITIONS
  // ============================================

  /**
   * Verifie si un utilisateur peut obtenir un certificat pour un cours.
   * @returns {Promise<{eligible: boolean, reasons: string[], score: number, quizScores: Array}>}
   */
  async checkEligibility(userId, courseId, cefrLevel) {
    const reasons = [];

    // 1. Verifier l'inscription
    const enrollment = await this.enrollRepo.findByUserAndCourse(userId, courseId);
    if (!enrollment) {
      return { eligible: false, reasons: ['Vous n\'etes pas inscrit a ce cours'], score: 0, quizScores: [] };
    }

    // 2. Verifier que toutes les lecons sont terminees
    const progress = enrollment.progress || 0;
    if (progress < 100) {
      reasons.push(`Progression incomplete : ${Math.round(progress)}% (100% requis)`);
    }

    // 3. Verifier les quiz
    const results = await this.resultRepo.findByUser(userId, 50);
    const courseResults = results.filter(r => r.quizId?.startsWith(courseId) || r.level === cefrLevel);
    const quizScores = courseResults.map(r => ({
      quizTitle: r.quizTitle || 'Quiz',
      score: r.percentage || 0,
      maxScore: 100,
      isPassing: r.isPassing || false
    }));

    const passingQuizzes = quizScores.filter(q => q.isPassing);
    if (passingQuizzes.length === 0 && courseResults.length > 0) {
      reasons.push('Aucun quiz reussi (score minimum 60% requis)');
    }

    // Score global
    const avgScore = quizScores.length > 0
      ? Math.round(quizScores.reduce((s, q) => s + q.score, 0) / quizScores.length)
      : Math.round(progress);

    if (avgScore < 60) {
      reasons.push(`Score insuffisant : ${avgScore}% (minimum 60%)`);
    }

    // 4. Verifier l'abonnement
    const sub = await this.subRepo.findActiveByUser(userId);
    if (!sub || (sub.plan === 'free' && !sub.status === 'active')) {
      reasons.push('Abonnement Standard ou superieur requis pour les certificats');
    }

    const eligible = reasons.length === 0;

    return { eligible, reasons, score: avgScore, quizScores };
  }

  // ============================================
  // GENERATION
  // ============================================

  /**
   * Genere un certificat si l'utilisateur est eligible.
   */
  async generateCertificate(userId, userName, userEmail, courseId, courseTitle, courseLevel, cefrLevel) {
    try {
      // Verifier si un certificat existe deja
      const existing = await this.certRepo.findByCourse(userId, courseId);
      if (existing) {
        const cert = Certificate.fromFirestore(existing.id, existing);
        if (cert.isValid()) {
          return { certificate: cert, isNew: false, error: null };
        }
      }

      // Verifier l'eligibilite
      const { eligible, reasons, score, quizScores } = await this.checkEligibility(userId, courseId, cefrLevel);
      if (!eligible) {
        return { certificate: null, isNew: false, error: `Non eligible : ${reasons.join(', ')}` };
      }

      // Charger la progression pour les heures d'apprentissage
      const progressData = await this.progressRepo.findById(userId);
      const learningHours = progressData?.totalStudyMinutes ? Math.round(progressData.totalStudyMinutes / 60) : 0;

      // Generer le certificat
      const certificate = Certificate.createFromCompletion(
        userId, userName, userEmail, courseId, courseTitle, courseLevel, cefrLevel,
        score, quizScores, learningHours
      );

      // Generer le QR Code
      const baseUrl = window.location.origin;
      certificate.generateVerificationUrl(baseUrl);
      certificate.qrCodeDataUrl = await this._generateQRCode(certificate.verificationUrl);

      // Sauvegarder
      await this.certRepo.create(certificate.id, certificate.toFirestore());

      return { certificate, isNew: true, error: null };

    } catch (err) {
      console.error('[CertificateService.generateCertificate]', err);
      return { certificate: null, isNew: false, error: translateFirebaseError(err) };
    }
  }

  /**
   * Regenere un certificat (re-emission).
   */
  async regenerateCertificate(certificateId) {
    try {
      const data = await this.certRepo.findById(certificateId);
      if (!data) return { certificate: null, error: 'Certificat introuvable' };

      const cert = Certificate.fromFirestore(data.id, data);
      if (cert.status === CERTIFICATE_STATUS.REVOKED) {
        return { certificate: null, error: 'Ce certificat a ete revoque' };
      }

      // Mettre a jour les dates
      cert.issueDate = new Date().toISOString();
      cert.status = CERTIFICATE_STATUS.ACTIVE;
      cert.revokedAt = null;
      cert.revokeReason = '';

      // Regenerer le QR Code
      const baseUrl = window.location.origin;
      cert.generateVerificationUrl(baseUrl);
      cert.qrCodeDataUrl = await this._generateQRCode(cert.verificationUrl);

      await this.certRepo.update(certificateId, cert.toFirestore());

      return { certificate: cert, error: null };

    } catch (err) {
      return { certificate: null, error: translateFirebaseError(err) };
    }
  }

  // ============================================
  // VERIFICATION
  // ============================================

  /**
   * Verifie un certificat par son numero.
   */
  async verifyByNumber(certificateNumber) {
    try {
      const data = await this.certRepo.findByNumber(certificateNumber);
      if (!data) return { found: false, certificate: null, error: 'Certificat introuvable' };

      const cert = Certificate.fromFirestore(data.id, data);

      // Incrementer le compteur
      cert.incrementVerifications();
      await this.certRepo.update(data.id, { verificationCount: cert.verificationCount, updatedAt: cert.updatedAt });

      return { found: true, certificate: cert.toVerificationFormat(), error: null };

    } catch (err) {
      return { found: false, certificate: null, error: 'Erreur de verification' };
    }
  }

  /**
   * Verifie par ID de certificat.
   */
  async verifyById(certificateId) {
    try {
      const data = await this.certRepo.findById(certificateId);
      if (!data) return { found: false, certificate: null };

      const cert = Certificate.fromFirestore(data.id, data);
      cert.incrementVerifications();
      await this.certRepo.update(data.id, { verificationCount: cert.verificationCount, updatedAt: cert.updatedAt });

      return { found: true, certificate: cert.toVerificationFormat() };
    } catch (err) {
      return { found: false, certificate: null };
    }
  }

  // ============================================
  // STATS
  // ============================================

  /** Charge les certificats d'un utilisateur. */
  async getUserCertificates(userId) {
    try {
      const certs = await this.certRepo.findByUser(userId);
      return certs.map(c => Certificate.fromFirestore(c.id, c).toDashboardFormat());
    } catch (err) {
      return [];
    }
  }

  /** Compte les certificats. */
  async countUserCertificates(userId) {
    return this.certRepo.countByUser(userId);
  }

  /** Stats pour le dashboard admin. */
  async getAdminStats() {
    try {
      const [allCerts, recentCerts] = await Promise.all([
        this.certRepo.findAllActive(1000),
        this.certRepo.findRecent(20)
      ]);

      const totalDownloads = allCerts.reduce((s, c) => s + (c.downloadCount || 0), 0);
      const totalVerifications = allCerts.reduce((s, c) => s + (c.verificationCount || 0), 0);

      const byLevel = {};
      Object.values(CEFR_LEVELS).forEach(l => byLevel[l] = 0);
      allCerts.forEach(c => { byLevel[c.cefrLevel] = (byLevel[c.cefrLevel] || 0) + 1; });

      return {
        totalCertificates: allCerts.length,
        totalDownloads,
        totalVerifications,
        byLevel,
        recent: recentCerts.map(c => Certificate.fromFirestore(c.id, c).toDashboardFormat())
      };
    } catch (err) {
      return { totalCertificates: 0, totalDownloads: 0, totalVerifications: 0, byLevel: {}, recent: [] };
    }
  }

  // ============================================
  // ADMIN
  // ============================================

  /** Revoke un certificat. */
  async revokeCertificate(certificateId, reason) {
    try {
      const data = await this.certRepo.findById(certificateId);
      if (!data) return { error: 'Certificat introuvable' };
      const cert = Certificate.fromFirestore(data.id, data);
      cert.revoke(reason);
      await this.certRepo.update(certificateId, cert.toFirestore());
      return { error: null };
    } catch (err) {
      return { error: translateFirebaseError(err) };
    }
  }

  // ============================================
  // QR CODE
  // ============================================

  /**
   * Genere un QR Code en data URL.
   * Utilise une approche simple avec un canvas si QRCode.js n'est pas disponible,
   * ou genere un lien vers le service de verification.
   */
  async _generateQRCode(text) {
    try {
      // Generer un QR code SVG inline simple
      // En production, utiliser une bibliotheque comme qrcode.js ou un service
      const svg = this._generateSimpleQR(text);
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    } catch (err) {
      return '';
    }
  }

  _generateSimpleQR(text) {
    // QR code SVG placeholder — en production utiliser qrcode.js
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white"/>
      <rect x="10" y="10" width="60" height="60" fill="black"/>
      <rect x="20" y="20" width="40" height="40" fill="white"/>
      <rect x="30" y="30" width="20" height="20" fill="black"/>
      <rect x="130" y="10" width="60" height="60" fill="black"/>
      <rect x="140" y="20" width="40" height="40" fill="white"/>
      <rect x="150" y="30" width="20" height="20" fill="black"/>
      <rect x="10" y="130" width="60" height="60" fill="black"/>
      <rect x="20" y="140" width="40" height="40" fill="white"/>
      <rect x="30" y="150" width="20" height="20" fill="black"/>
      <rect x="90" y="10" width="20" height="20" fill="black"/>
      <rect x="90" y="50" width="20" height="20" fill="black"/>
      <rect x="90" y="90" width="20" height="20" fill="black"/>
      <rect x="10" y="90" width="20" height="20" fill="black"/>
      <rect x="50" y="90" width="20" height="20" fill="black"/>
      <rect x="130" y="90" width="20" height="20" fill="black"/>
      <rect x="170" y="90" width="20" height="20" fill="black"/>
      <rect x="90" y="130" width="20" height="20" fill="black"/>
      <rect x="130" y="130" width="40" height="40" fill="black"/>
      <rect x="140" y="140" width="20" height="20" fill="white"/>
      <rect x="170" y="170" width="20" height="20" fill="black"/>
      <rect x="10" y="170" width="20" height="20" fill="black"/>
      <rect x="170" y="10" width="20" height="20" fill="black"/>
      <rect x="10" y="10" width="20" height="20" fill="black"/>
      <text x="100" y="196" font-size="8" text-anchor="middle" font-family="Arial">${text.substring(0, 30)}</text>
    </svg>`;
  }
}

export const certificateService = new CertificateService();
