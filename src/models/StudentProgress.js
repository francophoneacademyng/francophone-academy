/**
 * StudentProgress.js
 * Modele de domaine pour la progression d'un etudiant.
 * Represente la structure du document Firestore : student_progress/{uid}
 */

import { CEFR_LEVELS } from '../config/firebase.js';

/**
 * @class StudentProgress
 * Progression pedagogique d'un etudiant.
 */
export class StudentProgress {
  constructor(data = {}) {
    this.uid = data.uid || null;
    this.completedLessons = data.completedLessons || [];
    this.currentCourse = data.currentCourse || null;
    this.currentUnit = data.currentUnit || null;
    this.currentLesson = data.currentLesson || null;
    this.xp = data.xp || 0;
    this.streak = data.streak || 0;
    this.maxStreak = data.maxStreak || 0;
    this.cefrLevel = data.cefrLevel || CEFR_LEVELS.A1;
    this.studyTime = data.studyTime || 0; // en minutes
    this.quizzesTaken = data.quizzesTaken || 0;
    this.quizAverage = data.quizAverage || 0;
    this.certificates = data.certificates || [];
    this.achievements = data.achievements || [];
    this.dailyGoal = data.dailyGoal || 30; // minutes par jour
    this.dailyProgress = data.dailyProgress || 0;
    this.lastStudyDate = data.lastStudyDate || null;
    this.weeklySchedule = data.weeklySchedule || [];
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  /**
   * Cree une progression par defaut pour un nouvel utilisateur.
   * @param {string} uid
   * @returns {StudentProgress}
   */
  static createDefault(uid) {
    const now = new Date().toISOString();
    return new StudentProgress({
      uid,
      createdAt: now,
      updatedAt: now,
      lastStudyDate: now
    });
  }

  /**
   * Cree depuis un document Firestore.
   * @param {string} uid
   * @param {Object} docData
   * @returns {StudentProgress}
   */
  static fromFirestore(uid, docData) {
    return new StudentProgress({ ...docData, uid });
  }

  /**
   * Convertit en objet plain pour Firestore.
   * @returns {Object}
   */
  toFirestore() {
    const data = { ...this };
    delete data.uid;
    return data;
  }

  /**
   * Ajoute du temps d'etude.
   * @param {number} minutes
   */
  addStudyTime(minutes) {
    this.studyTime += minutes;
    this.dailyProgress += minutes;
    this.xp += Math.floor(minutes * 10);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Marque une lecon comme terminee.
   * @param {string} lessonId
   */
  completeLesson(lessonId) {
    if (!this.completedLessons.includes(lessonId)) {
      this.completedLessons.push(lessonId);
      this.xp += 50;
    }
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Calcule le niveau global (0-100).
   * @returns {number}
   */
  getOverallProgress() {
    const lessonsWeight = Math.min(this.completedLessons.length * 2, 40);
    const xpWeight = Math.min(this.xp / 100, 30);
    const quizWeight = Math.min(this.quizAverage * 0.3, 30);
    return Math.min(Math.round(lessonsWeight + xpWeight + quizWeight), 100);
  }

  /**
   * Retourne les competences detaillees.
   * @returns {Array<Object>}
   */
  getSkills() {
    return [
      { name: 'Grammaire', percentage: Math.min(this.quizAverage + 10, 100) },
      { name: 'Vocabulaire', percentage: Math.min(this.completedLessons.length * 5 + 20, 100) },
      { name: 'Comprehension', percentage: Math.min(this.studyTime / 10, 100) },
      { name: 'Expression', percentage: Math.min(this.xp / 50, 100) }
    ];
  }

  /**
   * Verifie si l'objectif quotidien est atteint.
   * @returns {boolean}
   */
  isDailyGoalMet() {
    return this.dailyProgress >= this.dailyGoal;
  }

  /**
   * Retourne le prochain niveau CECRL.
   * @returns {string}
   */
  getNextLevel() {
    const levels = Object.values(CEFR_LEVELS);
    const idx = levels.indexOf(this.cefrLevel);
    return levels[Math.min(idx + 1, levels.length - 1)];
  }
}
