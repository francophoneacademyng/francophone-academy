/**
 * LearningController.js
 * Controller pour le lesson player et la progression.
 */

import { aiService } from '../services/AIService.js';
import { AuthController } from './AuthController.js';

export class LearningController {
  constructor() {
    this.view = null;
    this._userId = null;
    this._currentCourseId = null;
    this._currentLessonId = null;
    this._courseStructure = null;
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
  // CHARGEMENT DU COURS
  // ============================================

  async loadCourse(courseId) {
    this._currentCourseId = courseId;
    this.view.renderLoading('Chargement du cours...');

    try {
      const [course, structure, enrollment] = await Promise.all([
        aiService.getCourse(courseId),
        aiService.getCourseStructure(courseId),
        this._getUserId() ? aiService.getEnrollment(this._getUserId(), courseId) : null
      ]);

      if (!course) {
        this.view.renderError('Cours introuvable.', null);
        return;
      }

      this._courseStructure = structure;

      // Trouver la premiere lecon ou reprendre
      let startLessonId = null;
      if (enrollment?.currentLessonId) {
        startLessonId = enrollment.currentLessonId;
      } else if (structure.modules.length > 0 && structure.modules[0].lessons.length > 0) {
        startLessonId = structure.modules[0].lessons[0].id;
      }

      this.view.renderCourse(course, structure.modules, enrollment);

      if (startLessonId) {
        await this.loadLesson(startLessonId);
      }

    } catch (err) {
      console.error('[LearningController.loadCourse]', err);
      this.view.renderError('Erreur de chargement du cours.', () => this.loadCourse(courseId));
    }
  }

  // ============================================
  // LECON
  // ============================================

  async loadLesson(lessonId) {
    if (!this._currentCourseId || !lessonId) return;
    this._currentLessonId = lessonId;

    try {
      const lesson = await aiService.getLesson(lessonId);
      const navigation = await aiService.getLessonNavigation(this._currentCourseId, lessonId);

      if (!lesson && navigation.current) {
        this.view.renderLesson(navigation.current, navigation.prev, navigation.next);
      } else if (lesson) {
        this.view.renderLesson(lesson, navigation.prev, navigation.next);
      }
    } catch (err) {
      this.view.showToast('Erreur de chargement de la lecon.', 'error');
    }
  }

  async onCompleteLesson() {
    const userId = this._getUserId();
    if (!userId || !this._currentCourseId || !this._currentLessonId) return;

    this.view.setLoading(true);
    const result = await aiService.completeLesson(userId, this._currentCourseId, this._currentLessonId);
    this.view.setLoading(false);

    if (result.error) {
      this.view.showToast(result.error, 'error');
      return;
    }

    this.view.showToast(`Lecon terminee ! Progression : ${result.progress}%`, 'success');
    this.view.updateProgress(result.progress);

    // Auto-navigation vers lecon suivante
    if (result.progress < 100) {
      const nav = await aiService.getLessonNavigation(this._currentCourseId, this._currentLessonId);
      if (nav.next) {
        setTimeout(() => this.loadLesson(nav.next.id), 1500);
      }
    } else {
      this.view.showToast('Felicitations ! Cours termine !', 'success', 5000);
    }
  }

  async onNavigateLesson(direction) {
    if (!this._currentCourseId || !this._currentLessonId) return;
    const nav = await aiService.getLessonNavigation(this._currentCourseId, this._currentLessonId);
    const target = direction === 'next' ? nav.next : nav.prev;
    if (target) {
      await this.loadLesson(target.id);
    }
  }

  // ============================================
  // SIDEBAR NAVIGATION
  // ============================================

  async onSelectLesson(lessonId) {
    await this.loadLesson(lessonId);
  }
}
