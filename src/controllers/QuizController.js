/**
 * QuizController.js
 * Controller pour le moteur d'evaluation pedagogique.
 * Gere les tentatives, corrections, scores et feedback IA.
 */

import { aiService } from '../services/AIService.js';
import { AuthController } from './AuthController.js';

export class QuizController {
  constructor() {
    this.view = null;
    this._userId = null;
    this._currentQuiz = null;
    this._currentQuestions = [];
    this._currentAttempt = null;
    this._timerInterval = null;
    this._timeSpent = 0;
    this._quizResult = null;
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

  /**
   * Charge le catalogue des quizzes pour l'utilisateur.
   */
  async loadCatalog(userLevel = 'A1') {
    const result = await aiService.getQuizCatalog(userLevel);
    return result || [];
  }

  /**
   * Filtre les quizzes.
   */
  async filterQuizzes(filters) {
    return aiService.filterQuizzes(filters);
  }

  /**
   * Trouve les quizzes pour un cours/lecon.
   */
  async getQuizzesForContext(courseId, lessonId) {
    return aiService.getQuizzesForContext(courseId, lessonId);
  }

  // ============================================
  // TENTATIVE
  // ============================================

  /**
   * Demarre un quiz.
   * @param {string} quizId
   */
  async onStartQuiz(quizId) {
    const userId = this._getUserId();
    if (!userId) {
      this.view?.showToast?.('Veuillez vous connecter', 'error');
      return;
    }

    this.view?.renderLoading?.('Chargement du quiz...');

    // Charger le quiz avec ses questions
    const { quiz, questions, error } = await aiService.getQuizWithQuestions(quizId);
    if (error || !quiz) {
      this.view?.showToast?.(error || 'Quiz introuvable', 'error');
      return;
    }

    this._currentQuiz = quiz;
    this._currentQuestions = questions;

    // Demarrer ou reprendre une tentative
    const { attempt, isNew, error: attemptError } = await aiService.startQuizAttempt(userId, quizId);
    if (attemptError) {
      this.view?.showToast?.(attemptError, 'error');
      return;
    }

    this._currentAttempt = attempt;
    this._timeSpent = attempt.timeSpent || 0;

    // Afficher le quiz
    this.view?.startQuiz?.(quiz, questions, attempt);

    // Demarrer le timer
    this._startTimer(quiz.duration);
  }

  /**
   * Enregistre une reponse.
   */
  async onAnswer(questionIndex, answer) {
    if (!this._currentAttempt) return;

    await aiService.saveQuizAnswer(this._currentAttempt.id, questionIndex, answer);

    // Auto-save toutes les 3 reponses
    const answeredCount = Object.keys(this._currentAttempt.answers || {}).length;
    if (answeredCount % 3 === 0) {
      await aiService.autoSaveQuiz(this._currentAttempt.id, {
        ...this._currentAttempt.answers,
        [questionIndex]: answer
      }, this._timeSpent);
    }

    this._currentAttempt.setAnswer(questionIndex, answer);
  }

  /**
   * Navigue vers une question.
   */
  onNavigateQuestion(index) {
    this.view?.showQuestion?.(index);
  }

  /**
   * Soumet le quiz.
   */
  async onSubmitQuiz() {
    if (!this._currentAttempt || !this._currentQuiz) return;

    this._stopTimer();
    this.view?.renderLoading?.('Correction en cours...');

    const { result, attempt, error } = await aiService.submitQuizAttempt(
      this._currentAttempt.id,
      this._currentQuiz,
      this._currentQuestions
    );

    if (error) {
      this.view?.showToast?.(error, 'error');
      return;
    }

    this._quizResult = result;

    // Generer le feedback IA
    this.view?.renderLoading?.('Generation du feedback...');
    const { feedback, recommendations, exercises } = await aiService.generateQuizFeedback(
      result,
      this._currentQuiz.level
    );

    // Afficher les resultats
    this.view?.showResult?.(result, feedback, recommendations, exercises);
  }

  /**
   * Gere le timeout.
   */
  async onTimeOut() {
    if (!this._currentAttempt || !this._currentQuiz) return;

    this._stopTimer();
    this.view?.showToast?.('Temps ecoule !', 'warning');

    const { result, error } = await aiService.timeOutQuizAttempt(
      this._currentAttempt.id,
      this._currentQuiz,
      this._currentQuestions
    );

    if (error) {
      this.view?.showToast?.(error, 'error');
      return;
    }

    this._quizResult = result;
    this.view?.showResult?.(result, 'Temps ecoule ! Voici vos resultats.', [], []);
  }

  /**
   * Abandonne le quiz.
   */
  async onAbandonQuiz() {
    if (!this._currentAttempt) return;

    this._stopTimer();
    await aiService.abandonQuizAttempt(this._currentAttempt.id);
    this._resetQuiz();
    this.view?.showCatalog?.();
  }

  /**
   * Relance le meme quiz.
   */
  async onRetryQuiz() {
    if (!this._currentQuiz) return;
    this._resetQuiz();
    await this.onStartQuiz(this._currentQuiz.id);
  }

  /**
   * Revient au catalogue.
   */
  onBackToCatalog() {
    this._resetQuiz();
    this.view?.showCatalog?.();
  }

  // ============================================
  // RESULTATS & STATS
  // ============================================

  /**
   * Charge les stats d'evaluation.
   */
  async loadAssessmentStats() {
    const userId = this._getUserId();
    if (!userId) return this._defaultStats();
    return aiService.getUserAssessmentStats(userId);
  }

  /**
   * Charge l'historique des resultats.
   */
  async loadResults() {
    const userId = this._getUserId();
    if (!userId) return [];
    return aiService.getUserQuizResults(userId);
  }

  /**
   * Charge les tentatives pour un quiz.
   */
  async loadQuizAttempts(quizId) {
    const userId = this._getUserId();
    if (!userId) return [];
    return aiService.getQuizAttempts(userId, quizId);
  }

  // ============================================
  // TIMER
  // ============================================

  _startTimer(durationMinutes) {
    this._stopTimer();
    if (!durationMinutes) return;

    const totalSeconds = durationMinutes * 60;
    let remaining = totalSeconds - this._timeSpent;

    this._timerInterval = setInterval(() => {
      remaining--;
      this._timeSpent++;

      this.view?.updateTimer?.(remaining);

      if (remaining <= 0) {
        this.onTimeOut();
      }
    }, 1000);
  }

  _stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  _resetQuiz() {
    this._stopTimer();
    this._currentQuiz = null;
    this._currentQuestions = [];
    this._currentAttempt = null;
    this._timeSpent = 0;
    this._quizResult = null;
  }

  _defaultStats() {
    return {
      lastScore: 0,
      lastQuizTitle: '',
      averageScore: 0,
      totalQuizzes: 0,
      isLastPassing: false,
      strengths: [],
      weaknesses: [],
      grammarScore: 0,
      vocabularyScore: 0,
      listeningScore: 0,
      speakingScore: 0,
      writingScore: 0,
      readingScore: 0,
      recentQuizzes: [],
      skillsToImprove: []
    };
  }

  destroy() {
    this._stopTimer();
  }
}
