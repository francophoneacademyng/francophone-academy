/**
 * join.js
 * Logique pour rejoindre un cours en direct
 */

import { LiveClassController } from '../../src/controllers/LiveClassController.js';
import { AuthController } from '../../src/controllers/AuthController.js';

class JoinPage {
  constructor() {
    this.controller = new LiveClassController();
    this.authController = AuthController;
    this.currentUser = null;
    this.liveClassId = null;
    this.liveClass = null;
    this.isLive = false;
    this.init();
  }

  async init() {
    try {
      this.currentUser = this.authController.getCurrentUser();
      this.liveClassId = this.getQueryParam('id');
      this.isLive = this.getQueryParam('live') === '1';

      if (!this.currentUser) {
        this.showLoginRequired();
        return;
      }

      if (!this.liveClassId) {
        this.showError('Cours non trouvé');
        return;
      }

      await this.loadLiveClass();
      this.renderJoinScreen();
    } catch (err) {
      console.error('[JoinPage.init]', err);
      this.showError('Erreur lors du chargement');
    }
  }

  async loadLiveClass() {
    try {
      this.liveClass = await this.controller.service.getLiveClass(this.liveClassId);
      if (!this.liveClass) {
        throw new Error('Cours non trouvé');
      }
    } catch (err) {
      throw err;
    }
  }

  renderJoinScreen() {
    if (!this.liveClass) {
      this.showError('Cours non trouvé');
      return;
    }

    const startDate = new Date(this.liveClass.startDate);
    const endDate = new Date(this.liveClass.endDate || this.liveClass.startDate);
    const now = new Date();
    const hasStarted = now >= startDate;
    const hasEnded = now > endDate;
    const isScheduled = !hasStarted && !hasEnded;

    let content = '';

    // Title and status
    content += `<h1 style="margin-bottom: 0.5rem;">${this._escape(this.liveClass.title)}</h1>`;

    if (hasEnded) {
      content += '<div class="error">❌ Ce cours est terminé</div>';
      content += `<p>Démarrage : ${startDate.toLocaleString('fr-FR')}</p>`;
      content += `<p>Fin : ${endDate.toLocaleString('fr-FR')}</p>`;
      
      if (this.liveClass.recordingUrl) {
        content += `<div class="success">
          ✓ Enregistrement disponible
          <a href="${this.liveClass.recordingUrl}" target="_blank" class="btn btn--primary" style="display: inline-block; margin-top: 1rem;">
            👁️ Regarder l'enregistrement
          </a>
        </div>`;
      }
    } else if (this.liveClass.status === 'cancelled') {
      content += '<div class="error">❌ Ce cours a été annulé</div>';
    } else if (isScheduled) {
      content += '<div class="success">⏰ Ce cours est prévu mais n\'a pas encore commencé</div>';
      content += `
        <div class="join-info">
          <div class="info-item">
            <span class="info-label">Démarrage :</span>
            <span class="info-value">${startDate.toLocaleString('fr-FR')}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Durée :</span>
            <span class="info-value">${this.liveClass.duration} minutes</span>
          </div>
          <div class="info-item">
            <span class="info-label">Plateforme :</span>
            <span class="info-value">${this._formatProvider(this.liveClass.meetingProvider)}</span>
          </div>
        </div>
      `;
    } else {
      content += '<div class="success">🔴 Le cours est EN DIRECT maintenant !</div>';
      content += `
        <div class="join-info">
          <div class="info-item">
            <span class="info-label">Plateforme :</span>
            <span class="info-value">${this._formatProvider(this.liveClass.meetingProvider)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Commencé :</span>
            <span class="info-value">${startDate.toLocaleString('fr-FR')}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Fin prévue :</span>
            <span class="info-value">${endDate.toLocaleString('fr-FR')}</span>
          </div>
        </div>
      `;
    }

    // Course info
    content += `
      <div class="join-info">
        <div class="info-item">
          <span class="info-label">Niveau :</span>
          <span class="info-value">${this.liveClass.level}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Description :</span>
          <span class="info-value">${this._escape(this.liveClass.description || '')}</span>
        </div>
      </div>
    `;

    // Documents
    if (this.liveClass.documents && this.liveClass.documents.length > 0) {
      content += `
        <div class="requirements">
          <h4>📄 Documents du cours</h4>
          <ul>
            ${this.liveClass.documents.map(doc => `
              <li><a href="${doc.url}" target="_blank">${this._escape(doc.name)}</a></li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // Requirements
    content += `
      <div class="requirements">
        <h4>✓ Avant de rejoindre</h4>
        <ul>
          <li>Assurez-vous d'avoir un navigateur compatible</li>
          <li>Vérifiez votre connexion Internet</li>
          <li>Ayez votre microphone et webcam (optionnel)</li>
          <li>Trouvez un endroit calme pour participer</li>
        </ul>
      </div>
    `;

    // Action buttons
    content += '<div class="join-actions">';

    if (!hasEnded && this.liveClass.status !== 'cancelled') {
      content += `
        <button class="btn btn--primary" onclick="joinMeeting('${this._escape(this.liveClass.meetingUrl)}', '${this.liveClassId}')">
          🎥 Rejoindre le cours
        </button>
      `;
    }

    content += `
      <button class="btn btn--secondary" onclick="window.location.href='/pages/live-classes/live-classes.html'">
        Retour aux cours
      </button>
    `;
    content += '</div>';

    document.getElementById('join-content').innerHTML = content;
  }

  getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  showLoginRequired() {
    document.getElementById('join-content').innerHTML = `
      <div style="text-align: center;">
        <h2 style="color: #991b1b;">Connexion requise</h2>
        <p>Vous devez être connecté pour rejoindre un cours.</p>
        <a href="/pages/login/login.html" class="btn btn--primary" style="display: inline-block; margin-top: 1rem;">
          Se connecter
        </a>
      </div>
    `;
  }

  showError(message) {
    document.getElementById('join-content').innerHTML = `
      <div class="error">
        <h2 style="margin-top: 0;">Erreur</h2>
        <p>${message}</p>
        <button class="btn btn--secondary" onclick="window.location.href='/pages/live-classes/live-classes.html'">
          Retour
        </button>
      </div>
    `;
  }

  _escape(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _formatProvider(provider) {
    const names = {
      'zoom': '🎥 Zoom',
      'google_meet': '🎬 Google Meet',
      'teams': '👥 Microsoft Teams'
    };
    return names[provider] || provider;
  }
}

// Global function to join meeting
window.joinMeeting = async function(meetingUrl, liveClassId) {
  try {
    // Mark attendance
    const controller = new (await import('../../src/controllers/LiveClassController.js')).LiveClassController();
    const mockView = { showToast: (msg) => console.log(msg) };
    controller.view = mockView;
    await controller.joinLiveClass(liveClassId);

    // Open meeting in new window
    window.open(meetingUrl, '_blank', 'width=1200,height=800');

    // Redirect back to live classes after 2 seconds
    setTimeout(() => {
      window.location.href = '/pages/live-classes/live-classes.html';
    }, 2000);
  } catch (err) {
    console.error('[joinMeeting]', err);
    alert('Erreur lors de la connexion au cours');
  }
};

// Initialize page
new JoinPage();
