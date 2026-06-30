/**
 * QuizAttempt.js
 * Modele de domaine pour une tentative de quiz.
 * Represente la structure de la collection Firestore : quiz_attempts/{attemptId}
 */

import { Question } from './Question.js';

/**
 * Statuts d'une tentative.
 */
export const ATTEMPT_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
  TIMED_OUT: 'timed_out'
};

/**
 * @class QuizAttempt
 * Modele de domaine pour une tentative de quiz.
 */
export class QuizAttempt {
  constructor(data = {}) {
    this.id = data.id || `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.userId = data.userId || '';
    this.quizId = data.quizId || '';
    this.status = data.status || ATTEMPT_STATUS.IN_PROGRESS;
    this.answers = data.answers || {}; // { questionIndex: answer }
    this.startedAt = data.startedAt || new Date().toISOString();
    this.submittedAt = data.submittedAt || null;
    this.timeSpent = data.timeSpent || 0; // secondes
    this.score = data.score || 0;
    this.maxScore = data.maxScore || 0;
    this.percentage = data.percentage || 0;
    this.isPassing = data.isPassing || false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Cree une nouvelle tentative.
   * @param {string} userId
   * @param {string} quizId
   * @returns {QuizAttempt}
   */
  static create(userId, quizId) {
    return new QuizAttempt({
      userId,
      quizId,
      status: ATTEMPT_STATUS.IN_PROGRESS,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Cree depuis un document Firestore.
   * @param {string} id
   * @param {Object} docData
   * @returns {QuizAttempt}
   */
  static fromFirestore(id, docData) {
    return new QuizAttempt({ ...docData, id });
  }

  /**
   * Convertit en objet plain pour Firestore.
   * @returns {Object}
   */
  toFirestore() {
    return {
      userId: this.userId,
      quizId: this.quizId,
      status: this.status,
      answers: this.answers,
      startedAt: this.startedAt,
      submittedAt: this.submittedAt,
      timeSpent: this.timeSpent,
      score: this.score,
      maxScore: this.maxScore,
      percentage: this.percentage,
      isPassing: this.isPassing,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Enregistre une reponse.
   * @param {number} questionIndex
   * @param {any} answer
   */
  setAnswer(questionIndex, answer) {
    this.answers[questionIndex] = answer;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Sauvegarde automatique (pour reprise).
   * @returns {Object}
   */
  getAutoSaveData() {
    return {
      attemptId: this.id,
      answers: this.answers,
      currentQuestion: Object.keys(this.answers).length,
      timeSpent: this.timeSpent,
      savedAt: new Date().toISOString()
    };
  }

  /**
   * Soumet la tentative.
   * @param {number} score
   * @param {number} maxScore
   */
  submit(score, maxScore) {
    this.status = ATTEMPT_STATUS.COMPLETED;
    this.submittedAt = new Date().toISOString();
    this.score = score;
    this.maxScore = maxScore;
    this.percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Marque comme abandonne.
   */
  abandon() {
    this.status = ATTEMPT_STATUS.ABANDONED;
    this.submittedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Marque comme timeout.
   */
  timeOut() {
    this.status = ATTEMPT_STATUS.TIMED_OUT;
    this.submittedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Met a jour le temps passe.
   * @param {number} seconds
   */
  updateTimeSpent(seconds) {
    this.timeSpent = seconds;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Compte les questions repondues.
   * @returns {number}
   */
  getAnsweredCount() {
    return Object.keys(this.answers).filter(k =>
      Question.isValidAnswer(this.answers[k])
    ).length;
  }

  /**
   * Indique si toutes les questions ont une reponse.
   * @param {number} totalQuestions
   * @returns {boolean}
   */
  isComplete(totalQuestions) {
    return this.getAnsweredCount() >= totalQuestions;
  }
}
