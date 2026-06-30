/**
 * StudentService.js
 * Service pour la gestion de la progression etudiant.
 *
 * Architecture : Controller -> StudentService -> StudentProgressRepository
 */

import { StudentProgressRepository } from '../repositories/StudentProgressRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { StudentProgress } from '../models/StudentProgress.js';
import { translateFirebaseError } from '../utils/firebaseErrors.js';

/**
 * @class StudentService
 * Service de progression etudiant.
 */
export class StudentService {
  constructor() {
    this.progressRepo = new StudentProgressRepository();
    this.userRepo = new UserRepository();
  }

  // ============================================
  // PROGRESSION
  // ============================================

  /**
   * Charge la progression complete d'un etudiant.
   * @param {string} uid
   * @returns {Promise<{progress: StudentProgress|null, error: string|null}>}
   */
  async getProgress(uid) {
    try {
      const data = await this.progressRepo.findByUid(uid);
      if (!data) {
        return { progress: StudentProgress.createDefault(uid), error: null };
      }

      return { progress: StudentProgress.fromFirestore(uid, data), error: null };
    } catch (err) {
      console.error('[StudentService.getProgress]', err);
      return {
        progress: StudentProgress.createDefault(uid),
        error: translateFirebaseError(err)
      };
    }
  }

  /**
   * Charge le profil utilisateur + progression.
   * @param {string} uid
   * @returns {Promise<{user: Object|null, progress: StudentProgress|null, error: string|null}>}
   */
  async getDashboardData(uid) {
    try {
      const [userData, progressData] = await Promise.all([
        this.userRepo.findByUid(uid),
        this.progressRepo.findByUid(uid)
      ]);

      return {
        user: userData ?? null,
        progress: progressData
          ? StudentProgress.fromFirestore(uid, progressData)
          : StudentProgress.createDefault(uid),
        error: null
      };
    } catch (err) {
      console.error('[StudentService.getDashboardData]', err);
      return {
        user: null,
        progress: StudentProgress.createDefault(uid),
        error: translateFirebaseError(err)
      };
    }
  }

  // ============================================
  // STATS POUR DASHBOARD
  // ============================================

  /**
   * Calcule les statistiques pour le dashboard.
   * @param {string} uid
   * @returns {Promise<Array<Object>>}
   */
  async getStats(uid) {
    try {
      const { progress } = await this.getProgress(uid);
      if (!progress) return this._defaultStats();

      return [
        {
          icon: '📚',
          label: 'Lecons terminees',
          value: String(progress.completedLessons?.length || 0),
          change: 15,
          bgColor: '#e3f2fd'
        },
        {
          icon: '⏱️',
          label: 'Heures d\'etude',
          value: `${Math.floor((progress.studyTime || 0) / 60)}h`,
          change: 8,
          bgColor: '#f3e5f5'
        },
        {
          icon: '🎯',
          label: 'Score moyen',
          value: `${Math.round(progress.quizAverage || 0)}%`,
          change: 5,
          bgColor: '#e8f5e9'
        },
        {
          icon: '🔥',
          label: 'Serie actuelle',
          value: `${progress.streak || 0} jours`,
          change: progress.streak > 0 ? 12 : 0,
          bgColor: '#fff3e0'
        }
      ];
    } catch (err) {
      console.warn('[StudentService.getStats] fallback', err);
      return this._defaultStats();
    }
  }

  /**
   * Retourne la progression formatee pour le dashboard.
   * @param {string} uid
   * @returns {Promise<Object>}
   */
  async getFormattedProgress(uid) {
    try {
      const { user } = await this.getDashboardData(uid);
      const { progress } = await this.getProgress(uid);

      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const currentLevel = user?.level || progress?.cefrLevel || 'A1';
      const currentIdx = levels.indexOf(currentLevel);
      const percentage = progress ? progress.getOverallProgress() : 0;

      return {
        currentLevel,
        nextLevel: levels[Math.min(currentIdx + 1, levels.length - 1)],
        percentage,
        skills: progress ? progress.getSkills() : []
      };
    } catch (err) {
      console.warn('[StudentService.getFormattedProgress] fallback', err);
      return {
        currentLevel: 'A1',
        nextLevel: 'A2',
        percentage: 0,
        skills: []
      };
    }
  }

  // ============================================
  // ACTIVITES
  // ============================================

  /**
   * Genere les activites recentes pour le dashboard.
   * @param {string} uid
   * @returns {Promise<Array<Object>>}
   */
  async getRecentActivities(uid) {
    try {
      const { progress } = await this.getProgress(uid);
      const now = Date.now();
      const activities = [];

      if (progress?.completedLessons?.length > 0) {
        activities.push({
          title: `${progress.completedLessons.length} lecons terminees`,
          type: 'Progression',
          timestamp: now - 3600000,
          icon: '📖',
          bgColor: '#e3f2fd'
        });
      }

      if (progress?.quizzesTaken > 0) {
        activities.push({
          title: `${progress.quizzesTaken} quiz passes`,
          type: 'Evaluation',
          timestamp: now - 86400000,
          score: Math.round(progress.quizAverage),
          icon: '📝',
          bgColor: '#e8f5e9'
        });
      }

      if (activities.length === 0) {
        activities.push(
          { title: 'Bienvenue sur Francophone Academy !', type: 'Onboarding', timestamp: now - 3600000, icon: '🎉', bgColor: '#fff3e0' },
          { title: 'Completez votre premier cours', type: 'Action', timestamp: now - 7200000, icon: '📖', bgColor: '#e3f2fd' },
          { title: 'Passez votre premier quiz', type: 'Action', timestamp: now - 86400000, icon: '📝', bgColor: '#fce4ec' }
        );
      }

      return activities;
    } catch (err) {
      console.warn('[StudentService.getRecentActivities] fallback', err);
      return [];
    }
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  /**
   * Genere les notifications pour le dashboard.
   * @returns {Promise<Array<Object>>}
   */
  async getNotifications() {
    const now = Date.now();
    return [
      {
        title: 'Nouvelle lecon disponible',
        message: '"Les expressions de temps" est maintenant accessible',
        timestamp: now - 1800000,
        read: false,
        icon: '📖'
      },
      {
        title: 'Rappel quotidien',
        message: 'N\'oubliez pas votre session d\'aujourd\'hui !',
        timestamp: now - 3600000,
        read: false,
        icon: '⏰'
      },
      {
        title: 'Felicitations !',
        message: 'Vous avez commence votre parcours',
        timestamp: now - 86400000,
        read: true,
        icon: '🎉'
      }
    ];
  }

  // ============================================
  // RECOMMANDATIONS
  // ============================================

  /**
   * Genere les recommandations pour le dashboard.
   * @param {string} uid
   * @returns {Promise<Array<Object>>}
   */
  async getRecommendations(uid) {
    try {
      const { user } = await this.getDashboardData(uid);
      const level = user?.level || 'A1';

      const recommendationsByLevel = {
        A1: [
          { icon: '✏️', type: 'Exercice', title: 'Conjugaison au present', description: 'Pratiquez les verbes du 1er et 2e groupe', actionLabel: 'Commencer' },
          { icon: '🎙️', type: 'Prononciation', title: 'Les voyelles nasales', description: 'Entrainez-vous sur les sons an, en, on', actionLabel: 'Ecouter' }
        ],
        A2: [
          { icon: '📖', type: 'Lecon', title: 'Le passe compose', description: 'Maitrisez le passe compose avec avoir et etre', actionLabel: 'Lire' },
          { icon: '✏️', type: 'Exercice', title: 'Vocabulaire: la ville', description: 'Apprenez le vocabulaire urbain', actionLabel: 'Commencer' }
        ],
        default: [
          { icon: '📖', type: 'Lecon', title: 'Les articles definis', description: 'Maitrisez le, la, les, l\'', actionLabel: 'Lire' },
          { icon: '🎙️', type: 'Prononciation', title: 'Les liaisons', description: 'Apprenez a lier les mots en francais', actionLabel: 'Ecouter' }
        ]
      };

      return recommendationsByLevel[level] || recommendationsByLevel.default;
    } catch (err) {
      console.warn('[StudentService.getRecommendations] fallback', err);
      return [];
    }
  }

  // ============================================
  // PLANNING
  // ============================================

  /**
   * Genere le planning du jour.
   * @returns {Promise<Array<Object>>}
   */
  async getSchedule() {
    return [
      { time: '09:00', title: 'Lecon: Les verbes du 1er groupe', duration: '30 min', type: 'Grammaire', icon: '📖', completed: false },
      { time: '10:00', title: 'Quiz: Vocabulaire quotidien', duration: '15 min', type: 'Evaluation', icon: '📝', completed: false },
      { time: '14:00', title: 'Pratique: Prononciation', duration: '20 min', type: 'Expression orale', icon: '🎙️', completed: false },
      { time: '16:00', title: 'Lecon: Les articles partitifs', duration: '25 min', type: 'Grammaire', icon: '📖', completed: false }
    ];
  }

  // ============================================
  // HELPER
  // ============================================

  _defaultStats() {
    return [
      { icon: '📚', label: 'Lecons terminees', value: '0', change: 0, bgColor: '#e3f2fd' },
      { icon: '⏱️', label: 'Heures d\'etude', value: '0h', change: 0, bgColor: '#f3e5f5' },
      { icon: '🎯', label: 'Score moyen', value: '0%', change: 0, bgColor: '#e8f5e9' },
      { icon: '🔥', label: 'Serie actuelle', value: '0 jours', change: 0, bgColor: '#fff3e0' }
    ];
  }
}

/** Instance singleton */
export const studentService = new StudentService();
