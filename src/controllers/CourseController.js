/**
 * CourseController.js
 * Controller pour le catalogue de cours et les inscriptions.
 */

import { aiService } from '../services/AIService.js';
import { AuthController } from './AuthController.js';

export class CourseController {
  constructor() {
    this.view = null;
    this._courses = [];
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

  // ============================================
  // CATALOGUE
  // ============================================

  async loadCatalog() {
    this.view.renderLoading('Chargement du catalogue...');
    try {
      const courses = await aiService.getCourseCatalog();
      this._courses = courses;
      this.view.render();
      this.view.renderCourses(courses);
    } catch (err) {
      this.view.renderError('Impossible de charger le catalogue.', () => this.loadCatalog());
    }
  }

  async filterByCategory(category) {
    const courses = await aiService.getCoursesByCategory(category);
    this.view.renderCourses(courses);
  }

  async filterByLevel(level) {
    const courses = await aiService.getCoursesByLevel(level);
    this.view.renderCourses(courses);
  }

  // ============================================
  // INSCRIPTION
  // ============================================

  async onEnroll(courseId) {
    const userId = this._getUserId();
    if (!userId) {
      this.view.showToast('Veuillez vous connecter pour vous inscrire.', 'warning');
      setTimeout(() => { window.location.href = '../login/login.html'; }, 1500);
      return;
    }

    this.view.setLoading(true);
    const result = await aiService.enrollInCourse(userId, courseId);
    this.view.setLoading(false);

    if (result.error) {
      this.view.showToast(result.error, 'error');
      return;
    }

    this.view.showToast('Inscription reussie ! Redirection...', 'success');
    setTimeout(() => {
      window.location.href = `../lesson/lesson.html?course=${courseId}`;
    }, 800);
  }

  async checkEnrollment(courseId) {
    const userId = this._getUserId();
    if (!userId) return false;
    return aiService.isEnrolledInCourse(userId, courseId);
  }

  // ============================================
  // NAVIGATION
  // ============================================

  onViewCourse(courseId) {
    window.location.href = `../lesson/lesson.html?course=${courseId}`;
  }

  // ============================================
  // USER COURSES (Dashboard)
  // ============================================

  async loadUserCourses() {
    const userId = this._getUserId();
    if (!userId) return [];
    try {
      return await aiService.getUserCourses(userId);
    } catch (err) {
      return [];
    }
  }
}
