/**
 * verify-certificate.js — Verification publique de certificat
 * Page publique : aucune authentification requise.
 */

import { CertificateController } from '../../src/controllers/CertificateController.js';

const controller = new CertificateController();
const resultContainer = document.getElementById('verify-result');
const form = document.getElementById('verify-form');
const input = document.getElementById('verify-input');

// Auto-fill from URL
const urlParams = new URLSearchParams(window.location.search);
const numberFromUrl = urlParams.get('number');
if (numberFromUrl) {
  input.value = numberFromUrl;
  verify(numberFromUrl);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const number = input.value.trim();
  if (number) verify(number);
});

async function verify(number) {
  resultContainer.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Verification en cours...</p></div>';

  const view = {
    showVerificationResult: (cert) => {
      const isValid = cert.isValid !== false && cert.status !== 'revoked';
      resultContainer.innerHTML = `
        <div class="verify-result ${isValid ? 'verify-result--valid' : 'verify-result--invalid'}">
          <div class="verify-result__icon">${isValid ? '&#9989;' : '&#10060;'}</div>
          <div class="verify-result__title" style="color:${isValid ? 'var(--success)' : 'var(--error)'}">
            ${isValid ? 'Certificat valide et authentique' : 'Certificat invalide'}
          </div>
          <div class="verify-result__details">
            <div class="verify-detail"><span class="verify-detail__label">Titulaire</span><span class="verify-detail__value">${cert.holderName || '-'}</span></div>
            <div class="verify-detail"><span class="verify-detail__label">Formation</span><span class="verify-detail__value">${cert.courseTitle || '-'}</span></div>
            <div class="verify-detail"><span class="verify-detail__label">Niveau CECRL</span><span class="verify-detail__value">${cert.cefrLevel || '-'}</span></div>
            <div class="verify-detail"><span class="verify-detail__label">Score</span><span class="verify-detail__value">${cert.score || 0}%</span></div>
            <div class="verify-detail"><span class="verify-detail__label">Mention</span><span class="verify-detail__value">${cert.grade || '-'}</span></div>
            <div class="verify-detail"><span class="verify-detail__label">Date d'emission</span><span class="verify-detail__value">${cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('fr-FR') : '-'}</span></div>
            <div class="verify-detail"><span class="verify-detail__label">Numero</span><span class="verify-detail__value" style="font-family:monospace">${cert.certificateNumber || number}</span></div>
            <div class="verify-detail"><span class="verify-detail__label">Emetteur</span><span class="verify-detail__value">${cert.issuer || 'Francophone Academy'}</span></div>
          </div>
        </div>`;
    },
    showVerificationFailed: (error) => {
      resultContainer.innerHTML = `
        <div class="verify-result verify-result--invalid">
          <div class="verify-result__icon">&#10060;</div>
          <div class="verify-result__title" style="color:var(--error)">Certificat introuvable</div>
          <p style="color:var(--text-secondary);font-size:0.875rem">${error || 'Aucun certificat ne correspond a ce numero. Verifiez le numero et reessayez.'}</p>
        </div>`;
    }
  };
  controller.setView(view);
  await controller.onVerifyCertificate(number);
}
