/**
 * AssessmentRepository.js
 * Acces aux collections d'evaluation dans Firestore :
 * quiz_attempts, quiz_results, student_scores, assessment_history
 */

import { BaseRepository } from './BaseRepository.js';
import { where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * QuizAttemptRepository — quiz_attempts/{attemptId}
 */
export class QuizAttemptRepository extends BaseRepository {
  constructor() {
    super('quiz_attempts');
  }

  /** Trouve les tentatives d'un utilisateur. */
  async findByUser(userId, maxResults = 50) {
    return this.query(
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
  }

  /** Trouve les tentatives pour un quiz specifique. */
  async findByQuiz(quizId, userId) {
    return this.query(
      where('quizId', '==', quizId),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }

  /** Trouve la tentative en cours d'un utilisateur pour un quiz. */
  async findInProgress(userId, quizId) {
    const results = await this.query(
      where('userId', '==', userId),
      where('quizId', '==', quizId),
      where('status', '==', 'in_progress'),
      limit(1)
    );
    return results[0] || null;
  }

  /** Compte les tentatives terminees pour un quiz. */
  async countAttempts(userId, quizId) {
    const attempts = await this.query(
      where('userId', '==', userId),
      where('quizId', '==', quizId),
      where('status', 'in', ['completed', 'timed_out'])
    );
    return attempts.length;
  }
}

/**
 * QuizResultRepository — quiz_results/{resultId}
 */
export class QuizResultRepository extends BaseRepository {
  constructor() {
    super('quiz_results');
  }

  /** Trouve les resultats d'un utilisateur. */
  async findByUser(userId, maxResults = 50) {
    return this.query(
      where('userId', '==', userId),
      orderBy('submittedAt', 'desc'),
      limit(maxResults)
    );
  }

  /** Trouve le meilleur resultat pour un quiz. */
  async findBestByQuiz(userId, quizId) {
    const results = await this.query(
      where('userId', '==', userId),
      where('quizId', '==', quizId),
      orderBy('percentage', 'desc'),
      limit(1)
    );
    return results[0] || null;
  }

  /** Calcule la moyenne generale d'un utilisateur. */
  async getAverageScore(userId) {
    const results = await this.findByUser(userId, 100);
    if (results.length === 0) return 0;
    return Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length);
  }

  /** Compte le nombre de quiz passes. */
  async countCompleted(userId) {
    const results = await this.query(where('userId', '==', userId));
    return results.length;
  }

  /** Trouve les resultats recents pour le dashboard. */
  async findRecent(userId, maxResults = 5) {
    return this.findByUser(userId, maxResults);
  }
}

/**
 * StudentScoresRepository — student_scores/{userId}
 * Agregation des scores pour acces rapide.
 */
export class StudentScoresRepository extends BaseRepository {
  constructor() {
    super('student_scores');
  }

  /** Charge ou cree les scores d'un etudiant. */
  async getOrCreate(userId) {
    const existing = await this.findById(userId);
    if (existing) return existing;
    const defaultScores = {
      userId,
      totalQuizzes: 0,
      averageScore: 0,
      bestScore: 0,
      grammarScore: 0,
      vocabularyScore: 0,
      listeningScore: 0,
      speakingScore: 0,
      writingScore: 0,
      readingScore: 0,
      completedQuizzes: [],
      quizHistory: [],
      strengths: [],
      weaknesses: [],
      lastQuizAt: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    await this.create(userId, defaultScores);
    return defaultScores;
  }

  /** Met a jour les scores apres un quiz. */
  async updateAfterQuiz(userId, quizResult) {
    const scores = await this.getOrCreate(userId);
    scores.totalQuizzes = (scores.totalQuizzes || 0) + 1;
    scores.lastQuizAt = new Date().toISOString();

    // Moyenne ponderee
    const oldAvg = scores.averageScore || 0;
    const newCount = scores.totalQuizzes;
    scores.averageScore = Math.round(((oldAvg * (newCount - 1)) + quizResult.percentage) / newCount);

    // Meilleur score
    if (quizResult.percentage > (scores.bestScore || 0)) {
      scores.bestScore = quizResult.percentage;
    }

    // Scores par competence
    if (quizResult.grammarScore > 0) scores.grammarScore = Math.round(((scores.grammarScore * (newCount - 1)) + quizResult.grammarScore) / newCount);
    if (quizResult.vocabularyScore > 0) scores.vocabularyScore = Math.round(((scores.vocabularyScore * (newCount - 1)) + quizResult.vocabularyScore) / newCount);
    if (quizResult.listeningScore > 0) scores.listeningScore = Math.round(((scores.listeningScore * (newCount - 1)) + quizResult.listeningScore) / newCount);
    if (quizResult.speakingScore > 0) scores.speakingScore = Math.round(((scores.speakingScore * (newCount - 1)) + quizResult.speakingScore) / newCount);
    if (quizResult.writingScore > 0) scores.writingScore = Math.round(((scores.writingScore * (newCount - 1)) + quizResult.writingScore) / newCount);
    if (quizResult.readingScore > 0) scores.readingScore = Math.round(((scores.readingScore * (newCount - 1)) + quizResult.readingScore) / newCount);

    // Historique
    scores.quizHistory = scores.quizHistory || [];
    scores.quizHistory.unshift({
      quizId: quizResult.quizId,
      quizTitle: quizResult.quizTitle,
      score: quizResult.percentage,
      isPassing: quizResult.isPassing,
      date: quizResult.submittedAt
    });
    if (scores.quizHistory.length > 50) scores.quizHistory = scores.quizHistory.slice(0, 50);

    // Forces et faiblesses
    scores.strengths = [];
    scores.weaknesses = [];
    const skillScores = [
      { skill: 'Grammaire', score: scores.grammarScore },
      { skill: 'Vocabulaire', score: scores.vocabularyScore },
      { skill: 'Comprehension orale', score: scores.listeningScore },
      { skill: 'Expression orale', score: scores.speakingScore },
      { skill: 'Expression ecrite', score: scores.writingScore },
      { skill: 'Comprehension ecrite', score: scores.readingScore }
    ];
    skillScores.forEach(s => {
      if (s.score >= 80) scores.strengths.push(s.skill);
      else if (s.score > 0 && s.score < 50) scores.weaknesses.push(s.skill);
    });

    scores.updatedAt = new Date().toISOString();
    await this.update(userId, scores);
    return scores;
  }
}
