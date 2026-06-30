/**
 * QuizResult.js
 * Modele de domaine pour le resultat d'un quiz.
 * Represente la structure de la collection Firestore : quiz_results/{resultId}
 * Ce document est immuable (historique).
 */

import { CEFR_LEVELS } from '../config/firebase.js';

/**
 * @class QuizResult
 * Modele de domaine pour un resultat de quiz.
 */
export class QuizResult {
  constructor(data = {}) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.quizId = data.quizId || '';
    this.attemptId = data.attemptId || '';
    this.quizTitle = data.quizTitle || '';
    this.level = data.level || CEFR_LEVELS.A1;
    this.category = data.category || 'general';

    // Scores
    this.score = data.score || 0;
    this.maxScore = data.maxScore || 0;
    this.percentage = data.percentage || 0;
    this.isPassing = data.isPassing || false;
    this.passingScore = data.passingScore || 60;

    // Details par question
    this.answers = data.answers || []; // [{questionId, questionText, userAnswer, correctAnswer, correct, score, explanation}]

    // Breakdown par competence
    this.skillBreakdown = data.skillBreakdown || {}; // { grammar: {correct, total, score}, ... }

    // Scores CECRL par competence
    this.grammarScore = data.grammarScore || 0;
    this.vocabularyScore = data.vocabularyScore || 0;
    this.listeningScore = data.listeningScore || 0;
    this.speakingScore = data.speakingScore || 0;
    this.writingScore = data.writingScore || 0;
    this.readingScore = data.readingScore || 0;

    // Feedback IA
    this.aiFeedback = data.aiFeedback || ''; // feedback textuel de l'IA
    this.aiRecommendations = data.aiRecommendations || []; // recommandations de revision
    this.skillsToImprove = data.skillsToImprove || []; // competences a retravailler

    // Metadonnees
    this.timeSpent = data.timeSpent || 0; // secondes
    this.submittedAt = data.submittedAt || new Date().toISOString();
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  /**
   * Cree un resultat depuis une tentative et des corrections.
   * @param {QuizAttempt} attempt
   * @param {Quiz} quiz
   * @param {Array<{correct: boolean, score: number, feedback: string}>} gradedAnswers
   * @returns {QuizResult}
   */
  static fromAttempt(attempt, quiz, gradedAnswers) {
    const totalScore = gradedAnswers.reduce((sum, g) => sum + g.score, 0);
    const maxScore = gradedAnswers.reduce((sum, g) => sum + g.maxScore, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Calculer le breakdown par competence
    const skillBreakdown = {};
    gradedAnswers.forEach(g => {
      const skill = g.skill || 'general';
      if (!skillBreakdown[skill]) {
        skillBreakdown[skill] = { correct: 0, total: 0, score: 0, maxScore: 0 };
      }
      skillBreakdown[skill].total++;
      skillBreakdown[skill].maxScore += g.maxScore;
      if (g.correct) skillBreakdown[skill].correct++;
      skillBreakdown[skill].score += g.score;
    });

    // Extraire les scores par domaine
    const getSkillScore = (category) => {
      const sb = Object.entries(skillBreakdown).find(([k]) => k.includes(category));
      if (!sb) return 0;
      const [, v] = sb;
      return v.maxScore > 0 ? Math.round((v.score / v.maxScore) * 100) : 0;
    };

    return new QuizResult({
      id: `result_${attempt.id}`,
      userId: attempt.userId,
      quizId: quiz.id,
      attemptId: attempt.id,
      quizTitle: quiz.title,
      level: quiz.level,
      category: quiz.category,
      score: totalScore,
      maxScore,
      percentage,
      isPassing: percentage >= quiz.passingScore,
      passingScore: quiz.passingScore,
      answers: gradedAnswers,
      skillBreakdown,
      grammarScore: getSkillScore('grammar'),
      vocabularyScore: getSkillScore('vocabulary'),
      listeningScore: getSkillScore('listening'),
      writingScore: getSkillScore('writing'),
      readingScore: getSkillScore('reading'),
      timeSpent: attempt.timeSpent,
      submittedAt: attempt.submittedAt || new Date().toISOString()
    });
  }

  /**
   * Cree depuis un document Firestore.
   * @param {string} id
   * @param {Object} docData
   * @returns {QuizResult}
   */
  static fromFirestore(id, docData) {
    return new QuizResult({ ...docData, id });
  }

  /**
   * Convertit en objet plain pour Firestore.
   * @returns {Object}
   */
  toFirestore() {
    return {
      userId: this.userId,
      quizId: this.quizId,
      attemptId: this.attemptId,
      quizTitle: this.quizTitle,
      level: this.level,
      category: this.category,
      score: this.score,
      maxScore: this.maxScore,
      percentage: this.percentage,
      isPassing: this.isPassing,
      passingScore: this.passingScore,
      answers: this.answers,
      skillBreakdown: this.skillBreakdown,
      grammarScore: this.grammarScore,
      vocabularyScore: this.vocabularyScore,
      listeningScore: this.listeningScore,
      speakingScore: this.speakingScore,
      writingScore: this.writingScore,
      readingScore: this.readingScore,
      aiFeedback: this.aiFeedback,
      aiRecommendations: this.aiRecommendations,
      skillsToImprove: this.skillsToImprove,
      timeSpent: this.timeSpent,
      submittedAt: this.submittedAt,
      createdAt: this.createdAt
    };
  }

  /**
   * Retourne les competences a ameliorer.
   * @returns {Array<string>}
   */
  getSkillsToImprove() {
    if (this.skillsToImprove.length > 0) return this.skillsToImprove;

    const skills = [];
    const scores = [
      { name: 'Grammaire', score: this.grammarScore },
      { name: 'Vocabulaire', score: this.vocabularyScore },
      { name: 'Comprehension orale', score: this.listeningScore },
      { name: 'Expression orale', score: this.speakingScore },
      { name: 'Expression ecrite', score: this.writingScore },
      { name: 'Comprehension ecrite', score: this.readingScore }
    ];

    return scores
      .filter(s => s.score > 0 && s.score < 70)
      .sort((a, b) => a.score - b.score)
      .map(s => s.name);
  }

  /**
   * Formate le resultat pour le dashboard.
   * @returns {Object}
   */
  toDashboardFormat() {
    return {
      id: this.id,
      title: this.quizTitle,
      score: this.percentage,
      level: this.level,
      date: this.submittedAt,
      isPassing: this.isPassing,
      breakdown: [
        { name: 'Grammaire', score: this.grammarScore },
        { name: 'Vocabulaire', score: this.vocabularyScore },
        { name: 'Comprehension', score: Math.max(this.listeningScore, this.readingScore) },
        { name: 'Expression', score: Math.max(this.speakingScore, this.writingScore) }
      ].filter(b => b.score > 0)
    };
  }
}
