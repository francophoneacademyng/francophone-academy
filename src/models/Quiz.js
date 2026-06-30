/**
 * Quiz.js
 * Modele de domaine pour un quiz d'evaluation.
 * Represente la structure de la collection Firestore : quizzes/{quizId}
 */

import { CEFR_LEVELS } from '../config/firebase.js';

/**
 * Types de questions supportes.
 */
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  SHORT_ANSWER: 'short_answer',
  OPEN_ENDED: 'open_ended',
  FILL_IN_BLANK: 'fill_in_blank',
  MATCHING: 'matching',
  ORDERING: 'ordering'
};

/**
 * Types d'examens officiels.
 */
export const EXAM_TYPES = {
  DELF: 'DELF',
  DALF: 'DALF',
  TCF: 'TCF',
  TEF: 'TEF',
  PRACTICE: 'practice'
};

/**
 * @class Quiz
 * Modele de domaine pour un quiz.
 */
export class Quiz {
  constructor(data = {}) {
    this.id = data.id || `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.title = data.title || 'Quiz sans titre';
    this.description = data.description || '';
    this.level = data.level || CEFR_LEVELS.A1;
    this.category = data.category || 'general';
    this.examType = data.examType || EXAM_TYPES.PRACTICE;
    this.questionIds = data.questionIds || [];
    this.questionCount = data.questionCount || 0;
    this.duration = data.duration || 15; // minutes
    this.passingScore = data.passingScore || 60; // pourcentage
    this.maxAttempts = data.maxAttempts || 3;
    this.courseId = data.courseId || '';
    this.lessonId = data.lessonId || '';
    this.moduleId = data.moduleId || '';
    this.skills = data.skills || []; // competences evaluees
    this.isPublished = data.isPublished ?? false;
    this.isArchived = data.isArchived ?? false;
    this.createdBy = data.createdBy || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Cree un nouveau quiz.
   * @param {Object} data
   * @returns {Quiz}
   */
  static create(data) {
    return new Quiz({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Cree depuis un document Firestore.
   * @param {string} id
   * @param {Object} docData
   * @returns {Quiz}
   */
  static fromFirestore(id, docData) {
    return new Quiz({ ...docData, id });
  }

  /**
   * Convertit en objet plain pour Firestore.
   * @returns {Object}
   */
  toFirestore() {
    return {
      title: this.title,
      description: this.description,
      level: this.level,
      category: this.category,
      examType: this.examType,
      questionIds: this.questionIds,
      questionCount: this.questionCount,
      duration: this.duration,
      passingScore: this.passingScore,
      maxAttempts: this.maxAttempts,
      courseId: this.courseId,
      lessonId: this.lessonId,
      moduleId: this.moduleId,
      skills: this.skills,
      isPublished: this.isPublished,
      isArchived: this.isArchived,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Verifie si le quiz est accessible pour un niveau donne.
   * @param {string} userLevel
   * @returns {boolean}
   */
  isAccessibleForLevel(userLevel) {
    const levels = Object.values(CEFR_LEVELS);
    const quizIdx = levels.indexOf(this.level);
    const userIdx = levels.indexOf(userLevel);
    return userIdx >= quizIdx - 1; // Quiz du niveau inferieur ou egal
  }

  /**
   * Publie le quiz.
   */
  publish() {
    this.isPublished = true;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Archive le quiz.
   */
  archive() {
    this.isArchived = true;
    this.isPublished = false;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Ajoute une question au quiz.
   * @param {string} questionId
   */
  addQuestion(questionId) {
    if (!this.questionIds.includes(questionId)) {
      this.questionIds.push(questionId);
      this.questionCount = this.questionIds.length;
      this.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Retire une question du quiz.
   * @param {string} questionId
   */
  removeQuestion(questionId) {
    this.questionIds = this.questionIds.filter(id => id !== questionId);
    this.questionCount = this.questionIds.length;
    this.updatedAt = new Date().toISOString();
  }
}
