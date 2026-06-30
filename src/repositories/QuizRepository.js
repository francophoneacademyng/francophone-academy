/**
 * QuizRepository.js
 * Acces a la collection quizzes/ dans Firestore.
 */

import { BaseRepository } from './BaseRepository.js';

export class QuizRepository extends BaseRepository {
  constructor() {
    super('quizzes');
  }

  /**
   * Liste les quizzes publies et non archives pour un niveau CECRL.
   * @param {string} level — A1, A2, B1, B2, C1, C2
   * @returns {Promise<Array<Object>>}
   */
  async findByLevel(level) {
    return this.query(
      where('level', '==', level),
      where('isPublished', '==', true),
      where('isArchived', '==', false)
    );
  }

  /**
   * Liste les quizzes publies pour un cours.
   * @param {string} courseId
   * @returns {Promise<Array<Object>>}
   */
  async findByCourse(courseId) {
    return this.query(
      where('courseId', '==', courseId),
      where('isPublished', '==', true),
      where('isArchived', '==', false)
    );
  }

  /**
   * Liste les quizzes publies pour une lecon.
   * @param {string} lessonId
   * @returns {Promise<Array<Object>>}
   */
  async findByLesson(lessonId) {
    return this.query(
      where('lessonId', '==', lessonId),
      where('isPublished', '==', true),
      where('isArchived', '==', false)
    );
  }

  /**
   * Liste tous les quizzes publies.
   * @returns {Promise<Array<Object>>}
   */
  async findPublished() {
    return this.query(
      where('isPublished', '==', true),
      where('isArchived', '==', false)
    );
  }

  /**
   * Liste les quizzes crees par un enseignant.
   * @param {string} instructorId
   * @returns {Promise<Array<Object>>}
   */
  async findByInstructor(instructorId) {
    return this.query(where('createdBy', '==', instructorId));
  }

  /**
   * Liste les quizzes par categorie.
   * @param {string} category
   * @returns {Promise<Array<Object>>}
   */
  async findByCategory(category) {
    return this.query(
      where('category', '==', category),
      where('isPublished', '==', true),
      where('isArchived', '==', false)
    );
  }

  /**
   * Liste les quizzes par type d'examen (DELF, DALF, TCF, TEF).
   * @param {string} examType
   * @returns {Promise<Array<Object>>}
   */
  async findByExamType(examType) {
    return this.query(
      where('examType', '==', examType),
      where('isPublished', '==', true),
      where('isArchived', '==', false)
    );
  }

  /**
   * Compte les quizzes pour un cours.
   * @param {string} courseId
   * @returns {Promise<number>}
   */
  async countByCourse(courseId) {
    const quizzes = await this.findByCourse(courseId);
    return quizzes.length;
  }
}

// Import where conditionally for queries that use it
import { where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
