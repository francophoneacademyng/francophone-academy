/**
 * create.js
 * Logique pour la création d'un cours en direct
 */

import { LiveClassController } from '../../src/controllers/LiveClassController.js';
import { CourseController } from '../../src/controllers/CourseController.js';
import { AuthController } from '../../src/controllers/AuthController.js';

class CreatePage {
  constructor() {
    this.liveClassController = new LiveClassController();
    this.courseController = new CourseController();
    this.authController = AuthController;
    this.currentUser = null;
    this.courses = [];
    this.init();
  }

  async init() {
    try {
      this.currentUser = this.authController.getCurrentUser();

      if (!this.currentUser) {
        this.showLoginRequired();
        return;
      }

      if (!this.currentUser.roles?.includes('teacher')) {
        this.showAccessDenied();
        return;
      }

      await this.loadCourses();
      this.setupForm();
      this.updateUserMenu();
    } catch (err) {
      console.error('[CreatePage.init]', err);
    }
  }

  async loadCourses() {
    try {
      // Get teacher's courses
      const courses = await this.courseController.getAllCourses();
      this.courses = courses || [];
      this.populateCourseSelect();
    } catch (err) {
      console.error('[CreatePage.loadCourses]', err);
      this.courses = [];
    }
  }

  populateCourseSelect() {
    const select = document.getElementById('courseId');
    if (!select) return;

    this.courses.forEach(course => {
      const option = document.createElement('option');
      option.value = course.id;
      option.textContent = course.title || 'Sans titre';
      select.appendChild(option);
    });
  }

  setupForm() {
    const form = document.getElementById('create-form');
    if (!form) return;

    form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Set min datetime to now
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      startDateInput.min = now.toISOString().slice(0, 16);
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    try {
      const formData = new FormData(document.getElementById('create-form'));
      const data = {
        title: formData.get('title'),
        description: formData.get('description'),
        courseId: formData.get('courseId'),
        level: formData.get('level'),
        startDate: formData.get('startDate'),
        duration: parseInt(formData.get('duration')),
        meetingProvider: formData.get('meetingProvider'),
        meetingId: formData.get('meetingId'),
        meetingUrl: formData.get('meetingUrl'),
        meetingPassword: formData.get('meetingPassword'),
        maxParticipants: parseInt(formData.get('maxParticipants')),
        createdBy: this.currentUser.uid
      };

      // Create a simple view for feedback
      const mockView = {
        showToast: (msg, type) => {
          alert(msg);
        },
        closeModal: () => {
          window.location.href = '/pages/live-classes/live-classes.html';
        }
      };

      this.liveClassController.view = mockView;
      await this.liveClassController.createLiveClass(data);
    } catch (err) {
      console.error('[handleSubmit]', err);
      alert('Erreur : ' + (err.message || 'Impossible de créer le cours'));
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
        <a href="/pages/login/login.html" style="padding: 10px 20px; background: #6366f1; color: white; border-radius: 5px; text-decoration: none; margin-top: 20px;">
          Se connecter
        </a>
      </div>
    `;
  }

  showAccessDenied() {
    document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center;">
        <h1>Accès refusé</h1>
        <p>Vous devez être professeur pour créer un cours.</p>
        <a href="/pages/dashboard/dashboard.html" style="padding: 10px 20px; background: #6366f1; color: white; border-radius: 5px; text-decoration: none; margin-top: 20px;">
          Retour au tableau de bord
        </a>
      </div>
    `;
  }
}

// Initialize page
new CreatePage();
