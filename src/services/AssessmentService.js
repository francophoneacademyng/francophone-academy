/**
 * AssessmentService.js
 * Moteur d'evaluation pedagogique.
 * Gere les tentatives, corrections, scores, feedback IA et progression.
 *
 * Controller -> AssessmentService -> Repositories + TutorService
 */

import {
  QuizAttemptRepository,
  QuizResultRepository,
  StudentScoresRepository
} from '../repositories/AssessmentRepository.js';
import { QuizAttempt, ATTEMPT_STATUS } from '../models/QuizAttempt.js';
import { QuizResult } from '../models/QuizResult.js';
import { Question } from '../models/Question.js';
import { QuizService, quizService } from './QuizService.js';
import { TutorService } from './TutorService.js';
import { StudentProgress } from '../models/StudentProgress.js';
import { StudentProgressRepository } from '../repositories/StudentProgressRepository.js';
import { translateFirebaseError } from '../utils/firebaseErrors.js';

// ============================================
// ASSESSMENT SERVICE
// ============================================

export class AssessmentService {
  constructor() {
    this.attemptRepo = new QuizAttemptRepository();
    this.resultRepo = new QuizResultRepository();
    this.scoresRepo = new StudentScoresRepository();
    this.progressRepo = new StudentProgressRepository();
    this.quizService = quizService;
  }

  // ============================================
  // TENTATIVES
  // ============================================

  /**
   * Demarre ou reprend une tentative de quiz.
   * @param {string} userId
   * @param {string} quizId
   * @returns {Promise<{attempt: QuizAttempt|null, isNew: boolean, error: string|null}>}
   */
  async startAttempt(userId, quizId) {
    try {
      // Verifier si le quiz existe
      const { quiz } = await this.quizService.getQuizWithQuestions(quizId);
      if (!quiz) return { attempt: null, isNew: false, error: 'Quiz introuvable' };

      // Verifier le nombre de tentatives
      const attemptCount = await this.attemptRepo.countAttempts(userId, quizId);
      if (attemptCount >= quiz.maxAttempts) {
        return { attempt: null, isNew: false, error: `Limite de ${quiz.maxAttempts} tentatives atteinte` };
      }

      // Chercher une tentative en cours
      const existing = await this.attemptRepo.findInProgress(userId, quizId);
      if (existing) {
        const attempt = QuizAttempt.fromFirestore(existing.id, existing);
        return { attempt, isNew: false, error: null };
      }

      // Creer une nouvelle tentative
      const attempt = QuizAttempt.create(userId, quizId);
      const saved = await this.attemptRepo.create(attempt.id, attempt.toFirestore());
      return { attempt, isNew: true, error: null };

    } catch (err) {
      console.error('[AssessmentService.startAttempt]', err);
      return { attempt: null, isNew: false, error: translateFirebaseError(err) };
    }
  }

  /**
   * Sauvegarde une reponse.
   * @param {string} attemptId
   * @param {number} questionIndex
   * @param {any} answer
   * @returns {Promise<{error: string|null}>}
   */
  async saveAnswer(attemptId, questionIndex, answer) {
    try {
      const attemptData = await this.attemptRepo.findById(attemptId);
      if (!attemptData) return { error: 'Tentative introuvable' };

      const attempt = QuizAttempt.fromFirestore(attemptId, attemptData);
      if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
        return { error: 'Cette tentative est terminee' };
      }

      attempt.setAnswer(questionIndex, answer);
      await this.attemptRepo.update(attemptId, { answers: attempt.answers, updatedAt: attempt.updatedAt });
      return { error: null };

    } catch (err) {
      return { error: translateFirebaseError(err) };
    }
  }

  /**
   * Sauvegarde automatique (pour reprise).
   * @param {string} attemptId
   * @param {Object} answers
   * @param {number} timeSpent
   * @returns {Promise<{error: string|null}>}
   */
  async autoSave(attemptId, answers, timeSpent) {
    try {
      await this.attemptRepo.update(attemptId, {
        answers,
        timeSpent,
        updatedAt: new Date().toISOString()
      });
      return { error: null };
    } catch (err) {
      return { error: translateFirebaseError(err) };
    }
  }

  /**
   * Soumet une tentative et calcule le score.
   * @param {string} attemptId
   * @param {Quiz} quiz
   * @param {Array<Question>} questions
   * @returns {Promise<{result: QuizResult|null, attempt: QuizAttempt|null, error: string|null}>}
   */
  async submitAttempt(attemptId, quiz, questions) {
    try {
      const attemptData = await this.attemptRepo.findById(attemptId);
      if (!attemptData) return { result: null, attempt: null, error: 'Tentative introuvable' };

      const attempt = QuizAttempt.fromFirestore(attemptId, attemptData);
      if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
        return { result: null, attempt: null, error: 'Tentative deja soumise' };
      }

      // Corriger chaque reponse
      const gradedAnswers = questions.map((q, i) => {
        const userAnswer = attempt.answers[i];
        const graded = q.grade(userAnswer);

        return {
          questionId: q.id,
          questionText: q.text,
          userAnswer: userAnswer ?? null,
          correctAnswer: q.correctAnswer ?? (q.options?.find(o => o.isCorrect)?.text) ?? q.correctOrder?.join(', ') ?? null,
          correct: graded.correct,
          score: graded.score,
          maxScore: graded.maxScore,
          explanation: graded.feedback,
          skill: q.skill || q.category,
          type: q.type
        };
      });

      // Calculer les scores par competence
      const totalScore = gradedAnswers.reduce((sum, g) => sum + g.score, 0);
      const maxScore = gradedAnswers.reduce((sum, g) => sum + g.maxScore, 0);

      // Soumettre la tentative
      attempt.submit(totalScore, maxScore);
      await this.attemptRepo.update(attemptId, attempt.toFirestore());

      // Creer le resultat
      const result = QuizResult.fromAttempt(attempt, quiz, gradedAnswers);
      await this.resultRepo.create(result.id, result.toFirestore());

      // Mettre a jour les scores agreges
      await this.scoresRepo.updateAfterQuiz(attempt.userId, result);

      // Mettre a jour la progression
      await this._updateStudentProgress(attempt.userId, result);

      return { result, attempt, error: null };

    } catch (err) {
      console.error('[AssessmentService.submitAttempt]', err);
      return { result: null, attempt: null, error: translateFirebaseError(err) };
    }
  }

  /**
   * Gere le timeout d'un quiz.
   */
  async timeOutAttempt(attemptId, quiz, questions) {
    try {
      const attemptData = await this.attemptRepo.findById(attemptId);
      if (!attemptData) return { result: null, error: 'Tentative introuvable' };

      const attempt = QuizAttempt.fromFirestore(attemptId, attemptData);
      attempt.timeOut();

      // Corriger les reponses existantes
      const gradedAnswers = questions.map((q, i) => {
        const userAnswer = attempt.answers[i];
        const graded = q.grade(userAnswer);
        return {
          questionId: q.id,
          questionText: q.text,
          userAnswer: userAnswer ?? null,
          correctAnswer: q.correctAnswer ?? (q.options?.find(o => o.isCorrect)?.text) ?? null,
          correct: graded.correct,
          score: graded.score,
          maxScore: graded.maxScore,
          explanation: graded.feedback,
          skill: q.skill || q.category,
          type: q.type
        };
      });

      const totalScore = gradedAnswers.reduce((sum, g) => sum + g.score, 0);
      const maxScore = gradedAnswers.reduce((sum, g) => sum + g.maxScore, 0);
      attempt.score = totalScore;
      attempt.maxScore = maxScore;
      attempt.percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      await this.attemptRepo.update(attemptId, attempt.toFirestore());

      const result = QuizResult.fromAttempt(attempt, quiz, gradedAnswers);
      await this.resultRepo.create(result.id, result.toFirestore());
      await this.scoresRepo.updateAfterQuiz(attempt.userId, result);
      await this._updateStudentProgress(attempt.userId, result);

      return { result, error: null };

    } catch (err) {
      return { result: null, error: translateFirebaseError(err) };
    }
  }

  /**
   * Abandonne une tentative.
   */
  async abandonAttempt(attemptId) {
    try {
      const attemptData = await this.attemptRepo.findById(attemptId);
      if (!attemptData) return { error: 'Tentative introuvable' };

      const attempt = QuizAttempt.fromFirestore(attemptId, attemptData);
      attempt.abandon();
      await this.attemptRepo.update(attemptId, attempt.toFirestore());
      return { error: null };

    } catch (err) {
      return { error: translateFirebaseError(err) };
    }
  }

  // ============================================
  // RESULTATS & STATS
  // ============================================

  /**
   * Charge l'historique des resultats d'un utilisateur.
   * @param {string} userId
   * @returns {Promise<Array<Object>>}
   */
  async getUserResults(userId) {
    try {
      const results = await this.resultRepo.findByUser(userId, 50);
      return results.map(r => QuizResult.fromFirestore(r.id, r).toDashboardFormat());
    } catch (err) {
      return [];
    }
  }

  /**
   * Charge les stats d'evaluation d'un utilisateur.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getUserAssessmentStats(userId) {
    try {
      const [scores, recentResults, avgScore, completedCount] = await Promise.all([
        this.scoresRepo.getOrCreate(userId),
        this.resultRepo.findRecent(userId, 5),
        this.resultRepo.getAverageScore(userId),
        this.resultRepo.countCompleted(userId)
      ]);

      const lastResult = recentResults[0];

      return {
        lastScore: lastResult?.percentage || 0,
        lastQuizTitle: lastResult?.quizTitle || '',
        averageScore: avgScore,
        totalQuizzes: completedCount,
        isLastPassing: lastResult?.isPassing || false,
        strengths: scores.strengths || [],
        weaknesses: scores.weaknesses || [],
        grammarScore: scores.grammarScore || 0,
        vocabularyScore: scores.vocabularyScore || 0,
        listeningScore: scores.listeningScore || 0,
        speakingScore: scores.speakingScore || 0,
        writingScore: scores.writingScore || 0,
        readingScore: scores.readingScore || 0,
        recentQuizzes: recentResults.map(r => ({
          quizTitle: r.quizTitle,
          score: r.percentage,
          isPassing: r.isPassing,
          date: r.submittedAt
        })),
        skillsToImprove: lastResult ? this._getSkillsToImprove(lastResult) : []
      };
    } catch (err) {
      return this._defaultStats();
    }
  }

  /**
   * Charge un resultat detaille.
   */
  async getResultDetail(resultId) {
    try {
      const data = await this.resultRepo.findById(resultId);
      if (!data) return null;
      return QuizResult.fromFirestore(resultId, data);
    } catch (err) {
      return null;
    }
  }

  /**
   * Meilleur score pour un quiz.
   */
  async getBestScore(userId, quizId) {
    try {
      const result = await this.resultRepo.findBestByQuiz(userId, quizId);
      return result?.percentage || 0;
    } catch (err) {
      return 0;
    }
  }

  // ============================================
  // FEEDBACK IA
  // ============================================

  /**
   * Genere un feedback pedagogique post-quiz.
   * Utilise le TutorService pour generer du contenu adapte.
   * @param {QuizResult} result
   * @param {string} cefrLevel
   * @returns {Promise<{feedback: string, recommendations: Array<string>, exercises: Array<Object>}>}
   */
  async generateFeedback(result, cefrLevel = 'A1') {
    try {
      const skillsToImprove = result.getSkillsToImprove();
      const correctCount = result.answers.filter(a => a.correct).length;
      const totalCount = result.answers.length;
      const incorrectAnswers = result.answers.filter(a => !a.correct);

      // Generer le feedback textuel
      let feedback = this._generateTextFeedback(result.percentage, correctCount, totalCount, cefrLevel);

      // Generer les recommandations
      const recommendations = this._generateRecommendations(result.percentage, skillsToImprove, cefrLevel);

      // Generer des exercices de remediation
      const exercises = this._generateRemediationExercises(skillsToImprove, cefrLevel, incorrectAnswers);

      // Sauvegarder le feedback dans le resultat
      result.aiFeedback = feedback;
      result.aiRecommendations = recommendations;
      result.skillsToImprove = skillsToImprove;
      await this.resultRepo.update(result.id, {
        aiFeedback: feedback,
        aiRecommendations: recommendations,
        skillsToImprove
      });

      return { feedback, recommendations, exercises };

    } catch (err) {
      console.error('[AssessmentService.generateFeedback]', err);
      return {
        feedback: `Vous avez obtenu ${result.percentage}%. ${result.isPassing ? 'Felicitations !' : 'Continuez a travailler !'}`,
        recommendations: ['Revisez le cours associe', 'Pratiquez avec le tuteur IA'],
        exercises: []
      };
    }
  }

  // ============================================
  // PROGRESSION
  // ============================================

  /**
   * Met a jour la progression de l'etudiant apres un quiz.
   * @private
   */
  async _updateStudentProgress(userId, result) {
    try {
      const data = await this.progressRepo.findById(userId);
      const progress = data
        ? StudentProgress.fromFirestore(userId, data)
        : StudentProgress.createDefault(userId);

      // Mettre a jour les stats de quiz
      progress.quizzesTaken = (progress.quizzesTaken || 0) + 1;

      // Recalculer la moyenne
      const oldAvg = progress.quizAverage || 0;
      const count = progress.quizzesTaken;
      progress.quizAverage = Math.round(((oldAvg * (count - 1)) + result.percentage) / count);

      // XP bonus
      const xpEarned = result.isPassing ? 100 : 50;
      progress.xp = (progress.xp || 0) + xpEarned;

      // Streak
      const today = new Date().toISOString().split('T')[0];
      const lastDate = progress.lastStudyDate?.split('T')[0];
      if (lastDate !== today) {
        progress.streak = (progress.streak || 0) + 1;
        if (progress.streak > (progress.maxStreak || 0)) {
          progress.maxStreak = progress.streak;
        }
      }
      progress.lastStudyDate = new Date().toISOString();
      progress.updatedAt = new Date().toISOString();

      await this.progressRepo.update(userId, progress.toFirestore());

    } catch (err) {
      console.error('[AssessmentService._updateStudentProgress]', err);
    }
  }

  // ============================================
  // FEEDBACK HELPERS
  // ============================================

  _generateTextFeedback(percentage, correct, total, level) {
    const parts = [];

    // Intro
    parts.push(`**Resultat : ${percentage}%** (${correct}/${total} bonnes reponses)`);

    if (percentage >= 80) {
      parts.push(`\nExcellent travail ! Votre niveau ${level} est bien maitrise.`);
      parts.push(`Vous avez une excellente comprehension des concepts testes.`);
    } else if (percentage >= 60) {
      parts.push(`\nBon resultat ! Vous progressez bien au niveau ${level}.`);
      parts.push(`Quelques points a consolider, mais l'ensemble est solide.`);
    } else if (percentage >= 40) {
      parts.push(`\nResultat moyen. Ne vous decouragez pas, la progression demande du temps.`);
      parts.push(`Concentrez-vous sur les competences a retravailler ci-dessous.`);
    } else {
      parts.push(`\nC'est un debut ! Chaque tentative est une opportunite d'apprendre.`);
      parts.push(`Je vous recommande de reviser le cours associe avant de reessayer.`);
    }

    // Encouragements specifiques
    if (percentage >= 70) {
      parts.push(`\n**Prochaine etape** : Essayez un quiz de niveau superieur ou un examen blanc DELF/DALF.`);
    }

    return parts.join('\n');
  }

  _generateRecommendations(percentage, skillsToImprove, level) {
    const recommendations = [];

    if (skillsToImprove.length > 0) {
      recommendations.push(`Retravaillez : ${skillsToImprove.join(', ')}`);
    }

    if (percentage < 60) {
      recommendations.push(`Revisez les lecons associees avant de reessayer`);
      recommendations.push(`Utilisez le tuteur IA pour poser vos questions`);
    }

    if (percentage >= 60 && percentage < 80) {
      recommendations.push(`Pratiquez avec des exercices supplementaires`);
      recommendations.push(`Concentrez-vous sur vos points faibles identifies`);
    }

    if (percentage >= 80) {
      recommendations.push(`Passez au niveau superieur (${level})`);
      recommendations.push(`Essayez un examen blanc DELF/DALF`);
    }

    recommendations.push(`Maintenez votre serie d'etude quotidienne`);

    return recommendations;
  }

  _generateRemediationExercises(skillsToImprove, level, incorrectAnswers) {
    const exercises = [];

    // Creer des exercices basees sur les erreurs
    incorrectAnswers.slice(0, 3).forEach((ans, i) => {
      if (ans.explanation) {
        exercises.push({
          title: `Exercice de remediation ${i + 1}`,
          type: ans.type || 'revision',
          description: ans.questionText,
          explanation: ans.explanation,
          skill: ans.skill
        });
      }
    });

    // Exercices generaux par competence faible
    skillsToImprove.slice(0, 2).forEach(skill => {
      exercises.push({
        title: `Renforcement : ${skill}`,
        type: 'practice',
        description: `Exercices cibles sur ${skill} au niveau ${level}`,
        skill
      });
    });

    return exercises;
  }

  _getSkillsToImprove(result) {
    return result.getSkillsToImprove();
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
}

/** Instance singleton */
export const assessmentService = new AssessmentService();
