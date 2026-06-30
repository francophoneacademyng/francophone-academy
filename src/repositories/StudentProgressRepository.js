/**
 * StudentProgressRepository.js
 * Acces a la collection Firestore : student_progress/{uid}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';

/**
 * @class StudentProgressRepository
 * Repository pour la progression des etudiants.
 */
export class StudentProgressRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.STUDENT_PROGRESS);
  }

  /**
   * Trouve la progression d'un etudiant par UID.
   * @param {string} uid
   * @returns {Promise<Object|null>}
   */
  async findByUid(uid) {
    return this.findById(uid);
  }

  /**
   * Cree la progression initiale pour un nouvel etudiant.
   * @param {string} uid
   * @param {Object} data
   */
  async createInitial(uid, data = {}) {
    const now = new Date().toISOString();
    return this.create(uid, {
      completedLessons: [],
      currentCourse: null,
      currentUnit: null,
      currentLesson: null,
      xp: 0,
      streak: 0,
      maxStreak: 0,
      cefrLevel: data.level || 'A1',
      studyTime: 0,
      quizzesTaken: 0,
      quizAverage: 0,
      certificates: [],
      achievements: [],
      dailyGoal: 30,
      dailyProgress: 0,
      lastStudyDate: now,
      weeklySchedule: [],
      createdAt: now,
      updatedAt: now,
      ...data
    });
  }

  /**
   * Marque une lecon comme terminee.
   * @param {string} uid
   * @param {string} lessonId
   */
  async completeLesson(uid, lessonId) {
    const progress = await this.findByUid(uid);
    const completed = progress?.completedLessons || [];
    if (!completed.includes(lessonId)) {
      completed.push(lessonId);
    }
    return this.update(uid, {
      completedLessons: completed,
      xp: (progress?.xp || 0) + 50
    });
  }

  /**
   * Ajoute du temps d'etude.
   * @param {string} uid
   * @param {number} minutes
   */
  async addStudyTime(uid, minutes) {
    const progress = await this.findByUid(uid);
    const currentStudyTime = progress?.studyTime || 0;
    const currentXp = progress?.xp || 0;
    const currentDaily = progress?.dailyProgress || 0;
    return this.update(uid, {
      studyTime: currentStudyTime + minutes,
      xp: currentXp + Math.floor(minutes * 10),
      dailyProgress: currentDaily + minutes,
      lastStudyDate: new Date().toISOString()
    });
  }

  /**
   * Met a jour la serie (streak).
   * @param {string} uid
   * @param {number} streak
   */
  async updateStreak(uid, streak) {
    const progress = await this.findByUid(uid);
    const maxStreak = Math.max(streak, progress?.maxStreak || 0);
    return this.update(uid, { streak, maxStreak });
  }

  /**
   * Met a jour le niveau CECRL.
   * @param {string} uid
   * @param {string} level
   */
  async updateCefrLevel(uid, level) {
    return this.update(uid, { cefrLevel: level });
  }

  /**
   * Enregistre un quiz termine.
   * @param {string} uid
   * @param {number} score
   */
  async recordQuiz(uid, score) {
    const progress = await this.findByUid(uid);
    const quizzesTaken = (progress?.quizzesTaken || 0) + 1;
    const totalScore = (progress?.quizAverage || 0) * (quizzesTaken - 1) + score;
    const quizAverage = Math.round(totalScore / quizzesTaken);
    return this.update(uid, { quizzesTaken, quizAverage });
  }

  /**
   * Reinitialise la progression quotidienne.
   * @param {string} uid
   */
  async resetDailyProgress(uid) {
    return this.update(uid, { dailyProgress: 0 });
  }
}
