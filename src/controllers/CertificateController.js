/**
 * CertificateController.js
 * Controller pour les certificats numeriques.
 */

import { aiService } from '../services/AIService.js';
import { AuthController } from './AuthController.js';

export class CertificateController {
  constructor() {
    this.view = null;
    this._userId = null;
  }

  setView(view) {
    this.view = view;
  }

  _getUserId() {
    if (!this._userId) {
      const user = AuthController.getCurrentUser();
      this._userId = user?.uid || null;
    }
    return this._userId;
  }

  _getUser() {
    return AuthController.getCurrentUser();
  }

  // ============================================
  // GENERATION
  // ============================================

  /**
   * Verifie l'eligibilite et genere un certificat.
   */
  async onRequestCertificate(courseId, courseTitle, courseLevel, cefrLevel) {
    const userId = this._getUserId();
    const user = this._getUser();
    if (!userId || !user) {
      this.view?.showToast?.('Veuillez vous connecter', 'error');
      return;
    }

    this.view?.renderLoading?.('Verification de votre progression...');

    const { certificate, isNew, error } = await aiService.generateCertificate(
      userId, user.displayName || '', user.email || '',
      courseId, courseTitle, courseLevel, cefrLevel
    );

    if (error) {
      this.view?.showToast?.(error, 'error');
      return;
    }

    if (certificate) {
      if (isNew) {
        this.view?.showToast?.('Certificat genere avec succes !', 'success');
      }
      this.view?.displayCertificate?.(certificate);
    }
  }

  /**
   * Verifie l'eligibilite sans generer.
   */
  async onCheckEligibility(courseId, cefrLevel) {
    const userId = this._getUserId();
    if (!userId) return null;
    return aiService.checkCertificateEligibility(userId, courseId, cefrLevel);
  }

  // ============================================
  // AFFICHAGE
  // ============================================

  /**
   * Charge les certificats de l'utilisateur.
   */
  async loadUserCertificates() {
    const userId = this._getUserId();
    if (!userId) return [];
    return aiService.getUserCertificates(userId);
  }

  /**
   * Affiche un certificat par ID.
   */
  async onViewCertificate(certificateId) {
    const cert = await aiService.getCertificateById(certificateId);
    if (cert) {
      this.view?.displayCertificate?.(cert);
    } else {
      this.view?.showToast?.('Certificat introuvable', 'error');
    }
  }

  // ============================================
  // PDF & DOWNLOAD
  // ============================================

  /**
   * Genere le PDF du certificat et declenche le telechargement.
   */
  onDownloadPDF(certificate) {
    if (!certificate) return;
    this._generateCertificatePDF(certificate);
    aiService.incrementCertificateDownloads(certificate.id);
  }

  /**
   * Genere le PDF avec les styles professionnels.
   */
  _generateCertificatePDF(cert) {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4 landscape; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Georgia', serif;
            width: 297mm; height: 210mm;
            background: linear-gradient(135deg, #fafbfc 0%, #f0f4ff 100%);
            display: flex; align-items: center; justify-content: center;
            position: relative;
          }
          .border-outer {
            width: 280mm; height: 193mm;
            border: 4px solid #6366f1;
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            position: relative;
          }
          .border-inner {
            width: 272mm; height: 185mm;
            border: 1px solid #6366f1;
            border-radius: 4px;
            padding: 30mm;
            display: flex; flex-direction: column;
            align-items: center; text-align: center;
          }
          .logo {
            font-size: 1.2rem; font-weight: 700; color: #6366f1;
            margin-bottom: 8mm; letter-spacing: 0.1em; text-transform: uppercase;
          }
          .title {
            font-size: 2.2rem; font-weight: 700; color: #1f2937;
            margin-bottom: 6mm; letter-spacing: 0.15em; text-transform: uppercase;
          }
          .subtitle {
            font-size: 1rem; color: #6b7280; margin-bottom: 12mm;
          }
          .recipient {
            font-size: 2.5rem; font-weight: 700; color: #1f2937;
            margin-bottom: 4mm; border-bottom: 2px solid #6366f1;
            padding-bottom: 2mm;
          }
          .course {
            font-size: 1.4rem; font-weight: 600; color: #6366f1;
            margin-bottom: 6mm;
          }
          .details {
            font-size: 0.9rem; color: #6b7280; margin-bottom: 4mm;
            display: flex; gap: 12mm; justify-content: center;
          }
          .detail-item { text-align: center; }
          .detail-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; }
          .detail-value { font-size: 1rem; font-weight: 600; color: #1f2937; }
          .footer {
            position: absolute; bottom: 15mm; left: 35mm; right: 35mm;
            display: flex; justify-content: space-between; align-items: flex-end;
            font-size: 0.75rem; color: #9ca3af;
          }
          .signature { text-align: center; }
          .signature-line { border-top: 1px solid #6366f1; width: 40mm; margin-bottom: 2mm; }
          .qr-placeholder {
            width: 25mm; height: 25mm; border: 1px solid #d1d5db;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.6rem; color: #9ca3af; text-align: center;
          }
          .watermark {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 5rem; font-weight: 700; color: rgba(99,102,241,0.05);
            pointer-events: none; white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div class="border-outer">
          <div class="border-inner">
            <div class="watermark">FRANCOPHONE ACADEMY</div>
            <div class="logo">&#127466;&#127482; Francophone Academy</div>
            <div class="title">Certificat d'accomplissement</div>
            <div class="subtitle">Ce certificat est decerne a</div>
            <div class="recipient">${cert.userName || 'Etudiant'}</div>
            <div class="course">${cert.courseTitle || 'Formation'}</div>
            <div class="details">
              <div class="detail-item">
                <div class="detail-label">Niveau CECRL</div>
                <div class="detail-value">${cert.cefrLevel || 'A1'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Score</div>
                <div class="detail-value">${cert.score || 0}%</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Mention</div>
                <div class="detail-value">${cert.gradeLabel || 'Bien'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Date</div>
                <div class="detail-value">${cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('fr-FR') : ''}</div>
              </div>
            </div>
            <div style="font-size:0.8rem;color:#6b7280;margin-top:6mm">
              N° ${cert.certificateNumber || ''}
            </div>
          </div>
          <div class="footer">
            <div class="signature">
              <div class="signature-line"></div>
              <div>Directeur Pedagogique</div>
            </div>
            <div style="text-align:center">
              <div class="qr-placeholder">QR Code<br>Scannez pour verifier</div>
              <div style="margin-top:2mm">Verifiez sur : francophone.academy/verify</div>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div>Francophone Academy</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  // ============================================
  // VERIFICATION PUBLIQUE
  // ============================================

  /**
   * Verifie un certificat par numero (page publique).
   */
  async onVerifyCertificate(certificateNumber) {
    const result = await aiService.verifyCertificateByNumber(certificateNumber);
    if (result.found) {
      this.view?.showVerificationResult?.(result.certificate);
    } else {
      this.view?.showVerificationFailed?.(result.error || 'Certificat introuvable');
    }
  }
}
