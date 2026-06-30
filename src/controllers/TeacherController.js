/**
 * TeacherController.js
 * Controller pour le tableau de bord enseignant.
 */

import { aiService } from '../services/AIService.js';
import { AuthController } from './AuthController.js';

export class TeacherController {
  constructor() {
    this.view = null;
  }

  setView(view) {
    this.view = view;
  }

  _getUserId() {
    const user = AuthController.getCurrentUser();
    return user?.uid || null;
  }

  // ============================================
  // COURS
  // ============================================

  async loadTeacherCourses() {
    const userId = this._getUserId();
    if (!userId) return;

    try {
      const courses = await aiService.getTeacherCourses(userId);
      this.view.renderCourses(courses);
    } catch (err) {
      this.view.showToast('Erreur de chargement des cours.', 'error');
    }
  }

  async onCreateCourse(data) {
    const userId = this._getUserId();
    if (!userId) return;

    const courseId = `course_${Date.now()}`;
    const result = await aiService.createCourse(courseId, {
      ...data,
      instructorId: userId,
      instructorName: AuthController.getCurrentUser()?.displayName || 'Enseignant'
    });

    if (result.error) {
      this.view.showToast(result.error, 'error');
      return;
    }

    this.view.showToast('Cours cree avec succes !', 'success');
    await this.loadTeacherCourses();
  }

  async onPublishCourse(courseId) {
    const result = await aiService.publishCourse(courseId);
    if (result.error) {
      this.view.showToast(result.error, 'error');
      return;
    }
    this.view.showToast('Cours publie !', 'success');
    await this.loadTeacherCourses();
  }

  async onArchiveCourse(courseId) {
    const result = await aiService.archiveCourse(courseId);
    if (result.error) {
      this.view.showToast(result.error, 'error');
      return;
    }
    this.view.showToast('Cours archive.', 'success');
    await this.loadTeacherCourses();
  }

  // ============================================
  // MODULES
  // ============================================

  async onCreateModule(data) {
    const moduleId = `mod_${Date.now()}`;
    const result = await aiService.createModule(moduleId, data);
    if (result.error) {
      this.view.showToast(result.error, 'error');
      return;
    }
    this.view.showToast('Module cree !', 'success');
  }

  // ============================================
  // LECONS
  // ============================================

  async onCreateLesson(data) {
    const lessonId = `lesson_${Date.now()}`;
    const result = await aiService.createLesson(lessonId, data);
    if (result.error) {
      this.view.showToast(result.error, 'error');
      return;
    }
    this.view.showToast('Lecon cree !', 'success');
  }
}
