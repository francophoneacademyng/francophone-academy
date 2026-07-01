/**
 * live-classes.js
 * Logique pour la page des cours en direct
 */

import { LiveClassController } from '../../src/controllers/LiveClassController.js';
import { LiveClassView } from '../../src/views/LiveClassView.js';
import { AuthController } from '../../src/controllers/AuthController.js';

class LiveClassesPage {
  constructor() {
    this.controller = new LiveClassController();
    this.view = null;
    this.authController = AuthController;
    this.currentUser = null;
    this.init();
  }

  async init() {
    try {
      this.currentUser = this.authController.getCurrentUser();

      if (!this.currentUser) {
        this.showLoginRequired();
        return;
      }

      this.setupTabbing();
      this.setupViews();
      await this.loadInitialData();
    } catch (err) {
      console.error('[LiveClassesPage.init]', err);
      this.showError('Erreur lors de l\'initialisation');
    }
  }

  setupTabbing() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(`tab-${tabName}`)?.classList.add('active');

        // Load data for clicked tab
        this.loadTabData(tabName);
      });
    });

    // Show teacher tab if user is teacher
    if (this.currentUser?.roles?.includes('teacher')) {
      const myClassesTab = document.getElementById('my-classes-tab');
      if (myClassesTab) myClassesTab.style.display = 'block';
    }
  }

  setupViews() {
    // Upcoming
    this.upcomingView = new LiveClassView('upcoming-container', 'student');
    this.upcomingView.onJoinClick = (id) => this.handleJoin(id);
    this.upcomingView.onDetailsClick = (id) => this.handleViewDetails(id);

    // Live
    this.liveView = new LiveClassView('live-container', 'student');
    this.liveView.onJoinLiveClick = (id) => this.handleJoinLive(id);
    this.liveView.onDetailsClick = (id) => this.handleViewDetails(id);

    // Recordings
    this.recordingsView = new LiveClassView('recordings-container', 'student');

    // My classes (teacher only)
    if (this.currentUser?.roles?.includes('teacher')) {
      this.myClassesView = new LiveClassView('my-classes-container', 'teacher');
      this.myClassesView.onCreateClick = () => this.handleCreate();
      this.myClassesView.onDetailsClick = (id) => this.handleViewDetails(id);
      this.myClassesView.onEditClick = (id) => this.handleEdit(id);
      this.myClassesView.onDeleteClick = (id) => this.handleDelete(id);
      this.myClassesView.onStartClick = (id) => this.handleStart(id);
      this.myClassesView.onCompleteClick = (id) => this.handleComplete(id);
      this.myClassesView.onCancelClick = (id) => this.handleCancel(id);
    }
  }

  async loadInitialData() {
    try {
      // Load upcoming classes
      this.controller.view = this.upcomingView;
      await this.controller.loadUpcomingLiveClasses();

      // Load live classes
      this.controller.view = this.liveView;
      await this.controller.loadLiveLiveClasses();

      // Load recordings
      this.controller.view = this.recordingsView;
      await this.controller.loadRecordings();

      // Load teacher classes if teacher
      if (this.currentUser?.roles?.includes('teacher')) {
        this.controller.view = this.myClassesView;
        await this.controller.loadTeacherLiveClasses();
      }

      this.updateUserMenu();
    } catch (err) {
      console.error('[LiveClassesPage.loadInitialData]', err);
    }
  }

  async loadTabData(tabName) {
    try {
      switch (tabName) {
        case 'upcoming':
          this.controller.view = this.upcomingView;
          await this.controller.loadUpcomingLiveClasses();
          break;

        case 'live':
          this.controller.view = this.liveView;
          await this.controller.loadLiveLiveClasses();
          break;

        case 'recordings':
          this.controller.view = this.recordingsView;
          await this.controller.loadRecordings();
          break;

        case 'my-classes':
          if (this.myClassesView) {
            this.controller.view = this.myClassesView;
            await this.controller.loadTeacherLiveClasses();
          }
          break;
      }
    } catch (err) {
      console.error('[LiveClassesPage.loadTabData]', err);
    }
  }

  // ============================================
  // HANDLERS
  // ============================================

  handleJoin(liveClassId) {
    const url = `/pages/live-classes/join.html?id=${liveClassId}`;
    window.location.href = url;
  }

  handleJoinLive(liveClassId) {
    const url = `/pages/live-classes/join.html?id=${liveClassId}&live=1`;
    window.location.href = url;
  }

  handleViewDetails(liveClassId) {
    const url = `/pages/live-classes/detail.html?id=${liveClassId}`;
    window.location.href = url;
  }

  handleCreate() {
    const url = `/pages/live-classes/create.html`;
    window.location.href = url;
  }

  handleEdit(liveClassId) {
    const url = `/pages/live-classes/edit.html?id=${liveClassId}`;
    window.location.href = url;
  }

  async handleDelete(liveClassId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;

    try {
      this.controller.view = this.myClassesView;
      await this.controller.deleteLiveClass(liveClassId);
    } catch (err) {
      console.error('[handleDelete]', err);
    }
  }

  async handleStart(liveClassId) {
    try {
      this.controller.view = this.myClassesView;
      await this.controller.startLiveClass(liveClassId);
    } catch (err) {
      console.error('[handleStart]', err);
    }
  }

  async handleComplete(liveClassId) {
    const recordingUrl = prompt('URL de l\'enregistrement (optionnel) :');
    
    try {
      this.controller.view = this.myClassesView;
      await this.controller.completeLiveClass(liveClassId, recordingUrl);
    } catch (err) {
      console.error('[handleComplete]', err);
    }
  }

  async handleCancel(liveClassId) {
    const reason = prompt('Raison de l\'annulation :');
    if (reason === null) return;

    try {
      this.controller.view = this.myClassesView;
      await this.controller.cancelLiveClass(liveClassId, reason);
    } catch (err) {
      console.error('[handleCancel]', err);
    }
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
        <p>Vous devez être connecté pour accéder à cette page.</p>
        <a href="/pages/login/login.html" style="padding: 10px 20px; background: #6366f1; color: white; border-radius: 5px; text-decoration: none; margin-top: 20px;">
          Se connecter
        </a>
      </div>
    `;
  }

  showError(message) {
    const container = document.querySelector('.container');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <div class="error-state__icon">❌</div>
          <h3>${message}</h3>
          <button class="btn btn--primary" onclick="location.reload()">Réessayer</button>
        </div>
      `;
    }
  }
}

// Initialize page
new LiveClassesPage();
