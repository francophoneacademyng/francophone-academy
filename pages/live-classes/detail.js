/**
 * detail.js
 * Logique pour la page de détails d'un cours en direct
 */

import { LiveClassController } from '../../src/controllers/LiveClassController.js';
import { LiveClassView } from '../../src/views/LiveClassView.js';
import { AuthController } from '../../src/controllers/AuthController.js';

class DetailPage {
  constructor() {
    this.controller = new LiveClassController();
    this.view = new LiveClassView('detail-container');
    this.authController = AuthController;
    this.currentUser = null;
    this.liveClassId = null;
    this.init();
  }

  async init() {
    try {
      this.currentUser = this.authController.getCurrentUser();
      this.liveClassId = this.getQueryParam('id');

      if (!this.currentUser) {
        this.showLoginRequired();
        return;
      }

      if (!this.liveClassId) {
        this.showError('Cours non trouvé');
        return;
      }

      this.setupView();
      await this.loadDetail();
      this.updateUserMenu();
    } catch (err) {
      console.error('[DetailPage.init]', err);
      this.showError('Erreur lors du chargement');
    }
  }

  setupView() {
    const userRole = this.currentUser?.roles?.includes('teacher') ? 'teacher' : 'student';
    this.view = new LiveClassView('detail-container', userRole);
    
    this.view.onJoinClick = (id) => this.handleJoin(id);
    this.view.onJoinLiveClick = (id) => this.handleJoinLive(id);
    this.view.onEditClick = (id) => this.handleEdit(id);
    this.view.onStartClick = (id) => this.handleStart(id);
    this.view.onCompleteClick = (id) => this.handleComplete(id);
    this.view.onCancelClick = (id) => this.handleCancel(id);
    this.view.onDeleteClick = (id) => this.handleDelete(id);
  }

  async loadDetail() {
    this.controller.view = this.view;
    await this.controller.loadLiveClass(this.liveClassId);
    
    // Load attendance for teachers
    if (this.currentUser?.roles?.includes('teacher')) {
      await this.controller.loadAttendance(this.liveClassId);
    }
  }

  getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  handleJoin(id) {
    window.location.href = `/pages/live-classes/join.html?id=${id}`;
  }

  handleJoinLive(id) {
    window.location.href = `/pages/live-classes/join.html?id=${id}&live=1`;
  }

  handleEdit(id) {
    window.location.href = `/pages/live-classes/edit.html?id=${id}`;
  }

  async handleStart(id) {
    this.controller.view = this.view;
    await this.controller.startLiveClass(id);
    await this.loadDetail();
  }

  async handleComplete(id) {
    const recordingUrl = prompt('URL de l\'enregistrement (optionnel) :');
    this.controller.view = this.view;
    await this.controller.completeLiveClass(id, recordingUrl);
    await this.loadDetail();
  }

  async handleCancel(id) {
    const reason = prompt('Raison de l\'annulation :');
    if (reason === null) return;
    
    this.controller.view = this.view;
    await this.controller.cancelLiveClass(id, reason);
    setTimeout(() => history.back(), 1500);
  }

  async handleDelete(id) {
    if (!confirm('Êtes-vous sûr ?')) return;
    
    this.controller.view = this.view;
    await this.controller.deleteLiveClass(id);
    setTimeout(() => history.back(), 1500);
  }

  updateUserMenu() {
    const userNameEl = document.getElementById('user-name');
    if (userNameEl && this.currentUser) {
      userNameEl.textContent = this.currentUser.displayName || this.currentUser.email;
    }
  }

  showLoginRequired() {
    document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center;">
        <h1>Connexion requise</h1>
        <a href="/pages/login/login.html" style="padding: 10px 20px; background: #6366f1; color: white; border-radius: 5px; text-decoration: none; margin-top: 20px;">
          Se connecter
        </a>
      </div>
    `;
  }

  showError(message) {
    const container = document.getElementById('detail-container');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <div class="error-state__icon">❌</div>
          <h3>${message}</h3>
          <button class="btn btn--primary" onclick="history.back()">Retour</button>
        </div>
      `;
    }
  }
}

// Initialize page
new DetailPage();
