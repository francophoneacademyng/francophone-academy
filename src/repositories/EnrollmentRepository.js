/**
 * EnrollmentRepository.js
 * Acces a la collection Firestore : enrollments/{enrollmentId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class EnrollmentRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ENROLLMENTS);
  }

  /**
   * Trouve l'inscription d'un utilisateur a un cours specifique.
   * @param {string} userId
   * @param {string} courseId
   * @returns {Promise<Object|null>}
   */
  async findByUserAndCourse(userId, courseId) {
    const results = await this.query(
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      limit(1)
    );
    return results[0] || null;
  }

  /**
   * Liste toutes les inscriptions d'un utilisateur.
   * @param {string} userId
   * @returns {Promise<Array<Object>>}
   */
  async findByUser(userId) {
    return this.query(
      where('userId', '==', userId),
      where('status', 'in', ['active', 'completed']),
      orderBy('lastAccessedAt', 'desc')
    );
  }

  /**
   * Liste les inscriptions pour un cours.
   * @param {string} courseId
   * @returns {Promise<Array<Object>>}
   */
  async findByCourse(courseId) {
    return this.query(
      where('courseId', '==', courseId),
      orderBy('startedAt', 'desc')
    );
  }

  /**
   * Verifie si un utilisateur est inscrit a un cours.
   * @param {string} userId
   * @param {string} courseId
   * @returns {Promise<boolean>}
   */
  async isEnrolled(userId, courseId) {
    const enrollment = await this.findByUserAndCourse(userId, courseId);
    return enrollment !== null && enrollment.status !== 'archived';
  }

  /**
   * Cree une inscription.
   * @param {string} enrollmentId
   * @param {Object} data
   */
  async createEnrollment(enrollmentId, data) {
    return this.create(enrollmentId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Met a jour la progression.
   * @param {string} enrollmentId
   * @param {Object} updates
   */
  async updateProgress(enrollmentId, updates) {
    return this.update(enrollmentId, {
      ...updates,
      lastAccessedAt: new Date().toISOString()
    });
  }

  /**
   * Marque une lecon comme terminee.
   * @param {string} enrollmentId
   * @param {string} lessonId
   * @param {Object} progressUpdate
   */
  async completeLesson(enrollmentId, lessonId, progressUpdate) {
    return this.update(enrollmentId, {
      completedLessons: progressUpdate.completedLessons,
      progress: progressUpdate.progress,
      currentModuleId: progressUpdate.currentModuleId || '',
      currentLessonId: progressUpdate.currentLessonId || '',
      status: progressUpdate.status || 'active',
      completedAt: progressUpdate.completedAt || null,
      lastAccessedAt: new Date().toISOString()
    });
  }
}
