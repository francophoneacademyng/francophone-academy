/**
 * certificate.js — Page Mes Certificats
 * Architecture : HTML -> View -> Controller -> AIService -> CertificateService -> CertificateRepository -> Firestore
 */

import { AuthController } from '../../src/controllers/AuthController.js';
import { CertificateController } from '../../src/controllers/CertificateController.js';

if (!AuthController.isAuthenticated()) {
  window.location.href = '../login/login.html';
}

const controller = new CertificateController();
const container = document.getElementById('cert-container');
const user = AuthController.getCurrentUser();

// Parse URL params (view specific certificate)
const urlParams = new URLSearchParams(window.location.search);
const certId = urlParams.get('id');
const viewMode = urlParams.get('view');

// ============================================
// VIEW
// ============================================
const view = {
  showToast: (message, type = 'info', duration = 3000) => {
    const tc = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    tc.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => { toast.classList.remove('toast--visible'); setTimeout(() => toast.remove(), 300); }, duration);
  },

  renderLoading: (msg) => {
    container.innerHTML = `<div class="loading-state" style="padding:var(--space-8)"><div class="loading-spinner"></div><p>${msg}</p></div>`;
  },

  renderEmpty: () => {
    container.innerHTML = `
      <div class="empty-state" style="padding:var(--space-8)">
        <div class="empty-icon">&#127942;</div>
        <h3>Aucun certificat pour le moment</h3>
        <p style="color:var(--text-secondary);margin-bottom:var(--space-4)">Completez un cours et reussissez les quiz pour obtenir votre premier certificat.</p>
        <a href="../courses/courses.html" class="btn btn--primary">Parcourir les cours</a>
      </div>`;
  },

  // ========== LISTE ==========
  renderCertificateList: (certificates) => {
    if (!certificates || certificates.length === 0) {
      view.renderEmpty();
      return;
    }

    let html = '<div class="cert-grid">';
    certificates.forEach(cert => {
      const isValid = cert.isValid !== false;
      html += `
        <div class="cert-card" data-cert-id="${cert.id}">
          <div class="cert-card__number">${cert.certificateNumber}</div>
          <h3 class="cert-card__title">${cert.courseTitle}</h3>
          <div class="cert-card__meta">
            <span class="badge badge--${(cert.cefrLevel || 'A1').toLowerCase()}">${cert.cefrLevel}</span>
            <span>${cert.grade}</span>
            <span class="cert-card__badge ${isValid ? 'cert-card__badge--valid' : 'cert-card__badge--revoked'}">${isValid ? 'Valide' : 'Revoque'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="cert-card__score">${cert.score}%</span>
            <span style="font-size:0.75rem;color:var(--text-muted)">${cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('fr-FR') : ''}</span>
          </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;

    // Click handlers
    container.querySelectorAll('.cert-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.certId;
        controller.onViewCertificate(id);
      });
    });
  },

  // ========== AFFICHAGE CERTIFICAT ==========
  displayCertificate: (cert) => {
    const isValid = cert.status !== 'revoked' && cert.status !== 'expired';

    let html = `
      <div class="cert-display">
        <div class="cert-display__header">
          <div class="cert-display__icon">&#127942;</div>
          <div class="cert-display__title">Certificat d'accomplissement</div>
          <div class="cert-display__subtitle">Francophone Academy</div>
        </div>
        <div class="cert-display__body">
          <div class="cert-display__recipient">${cert.userName || 'Etudiant'}</div>
          <div class="cert-display__course">${cert.courseTitle || 'Formation'}</div>

          <div class="cert-display__details">
            <div class="cert-detail">
              <span class="cert-detail__label">Niveau CECRL</span>
              <span class="cert-detail__value">${cert.cefrLevel || 'A1'}</span>
            </div>
            <div class="cert-detail">
              <span class="cert-detail__label">Score final</span>
              <span class="cert-detail__value cert-detail__value--score">${cert.score || 0}%</span>
            </div>
            <div class="cert-detail">
              <span class="cert-detail__label">Mention</span>
              <span class="cert-detail__value">${cert.gradeLabel || cert.grade || '-'}</span>
            </div>
            <div class="cert-detail">
              <span class="cert-detail__label">Date</span>
              <span class="cert-detail__value">${cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('fr-FR') : '-'}</span>
            </div>
            ${cert.learningHours ? `
            <div class="cert-detail">
              <span class="cert-detail__label">Heures d'etude</span>
              <span class="cert-detail__value">${cert.learningHours}h</span>
            </div>` : ''}
          </div>

          <div class="cert-display__number">
            &#128274; N° ${cert.certificateNumber || cert.id}
          </div>

          ${cert.qrCodeDataUrl || cert.verificationUrl ? `
            <div class="cert-qr">
              ${cert.qrCodeDataUrl ? `<img src="${cert.qrCodeDataUrl}" alt="QR Code de verification">` : ''}
              <div class="cert-qr__label">Scannez pour verifier l'authenticite</div>
              ${cert.verificationUrl ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:var(--space-1)"><a href="${cert.verificationUrl}" target="_blank">${cert.verificationUrl}</a></div>` : ''}
            </div>
          ` : ''}

          <div class="cert-actions">
            <button class="btn btn--primary" data-action="download" data-cert-id="${cert.id}">&#128190; Telecharger PDF</button>
            <a href="${cert.verificationUrl || '#'}" target="_blank" class="btn btn--outline">&#128270; Verifier en ligne</a>
            <button class="btn btn--text" data-action="back">&#8592; Retour</button>
          </div>
        </div>
      </div>`;

    container.innerHTML = html;

    // Bind
    container.querySelector('[data-action="download"]')?.addEventListener('click', () => {
      controller.onDownloadPDF(cert);
    });
    container.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      loadCertificates();
    });
  }
};

controller.setView(view);

// Events
document.getElementById('btn-logout')?.addEventListener('click', () => AuthController.logout());
document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
  document.getElementById('cert-sidebar').classList.toggle('cert-sidebar--open');
});

// Init
async function loadCertificates() {
  view.renderLoading('Chargement de vos certificats...');
  const certs = await controller.loadUserCertificates();
  view.renderCertificateList(certs);
}

// If viewing specific certificate
if (certId) {
  view.renderLoading('Chargement du certificat...');
  controller.onViewCertificate(certId);
} else {
  loadCertificates();
}
