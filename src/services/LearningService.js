/**
 * LearningService.js
 * Service pour le parcours d'apprentissage : modules, lecons, progression.
 *
 * Controller -> LearningService -> ModuleRepository + LessonRepository + EnrollmentRepository
 */

import { ModuleRepository } from '../repositories/ModuleRepository.js';
import { LessonRepository } from '../repositories/LessonRepository.js';
import { EnrollmentRepository } from '../repositories/EnrollmentRepository.js';
import { Module } from '../models/Module.js';
import { Lesson } from '../models/Lesson.js';
import { translateFirebaseError } from '../utils/firebaseErrors.js';

/**
 * Lecons par defaut pour les cours sans donnees Firestore.
 */
function getDefaultLessons(moduleId, courseId, moduleOrder) {
  const baseNum = moduleOrder * 10;
  return [
    { id: `l-${moduleId}-1`, courseId, moduleId, title: 'Introduction', description: 'Introduction au module', order: baseNum + 1, type: 'theory', duration: 15, content: [{ type: 'heading', content: 'Bienvenue dans ce module' }, { type: 'text', content: 'Dans ce module, vous allez apprendre les concepts essentiels.' }], objectives: ['Comprendre les bases'], hasQuiz: false },
    { id: `l-${moduleId}-2`, courseId, moduleId, title: 'Lecon 1 : Concepts de base', description: 'Les fondamentaux', order: baseNum + 2, type: 'theory', duration: 25, content: [{ type: 'heading', content: 'Concepts de base' }, { type: 'text', content: 'Voici les concepts fondamentaux de cette lecon.' }, { type: 'example', french: 'Bonjour, comment allez-vous ?', translation: 'Hello, how are you?' }], objectives: ['Maitriser les concepts de base'], hasQuiz: true },
    { id: `l-${moduleId}-3`, courseId, moduleId, title: 'Exercices pratiques', description: 'Mettez en pratique', order: baseNum + 3, type: 'exercise', duration: 20, content: [{ type: 'heading', content: 'Exercices' }, { type: 'text', content: 'Completez les exercices suivants pour valider vos connaissances.' }], objectives: ['Pratiquer'], hasQuiz: false },
    { id: `l-${moduleId}-4`, courseId, moduleId, title: 'Quiz de validation', description: 'Testez vos connaissances', order: baseNum + 4, type: 'quiz', duration: 15, content: [{ type: 'heading', content: 'Quiz' }, { type: 'text', content: 'Repondez aux questions pour valider ce module.' }], objectives: ['Valider les acquis'], hasQuiz: true }
  ];
}

function getDefaultModules(courseId) {
  return [
    { id: `m-${courseId}-1`, courseId, title: 'Module 1 : Bien commencer', description: 'Introduction et bases', order: 1, lessonCount: 4, duration: 75 },
    { id: `m-${courseId}-2`, courseId, title: 'Module 2 : Les fondamentaux', description: 'Concepts essentiels', order: 2, lessonCount: 4, duration: 90 },
    { id: `m-${courseId}-3`, courseId, title: 'Module 3 : En pratique', description: 'Application et exercices', order: 3, lessonCount: 4, duration: 80 },
    { id: `m-${courseId}-4`, courseId, title: 'Module 4 : Approfondissement', description: 'Aller plus loin', order: 4, lessonCount: 4, duration: 85 }
  ];
}

export class LearningService {
  constructor() {
    this.moduleRepo = new ModuleRepository();
    this.lessonRepo = new LessonRepository();
    this.enrollmentRepo = new EnrollmentRepository();
  }

  // ============================================
  // MODULES
  // ============================================

  async getModules(courseId) {
    try {
      let modules = await this.moduleRepo.findPublishedByCourse(courseId);
      if (modules.length === 0) {
        modules = getDefaultModules(courseId);
      }
      return modules.map(m => Module.fromFirestore(m.id || m.id, m));
    } catch (err) {
      return getDefaultModules(courseId).map(m => Module.fromFirestore(m.id, m));
    }
  }

  // ============================================
  // LECONS
  // ============================================

  async getLessons(moduleId) {
    try {
      let lessons = await this.lessonRepo.findPublishedByModule(moduleId);
      if (lessons.length === 0) {
        // Trouver le module pour le courseId
        const moduleData = await this.moduleRepo.findById(moduleId);
        const courseId = moduleData?.courseId || 'default';
        const modOrder = moduleData?.order || 1;
        lessons = getDefaultLessons(moduleId, courseId, modOrder);
      }
      return lessons.map(l => Lesson.fromFirestore(l.id || l.id, l));
    } catch (err) {
      return getDefaultLessons(moduleId, 'default', 1).map(l => Lesson.fromFirestore(l.id, l));
    }
  }

  async getLesson(lessonId) {
    try {
      const data = await this.lessonRepo.findById(lessonId);
      if (!data) return null;
      return Lesson.fromFirestore(data.id, data);
    } catch (err) {
      return null;
    }
  }

  /**
   * Charge toute la structure d'un cours pour le lesson player.
   */
  async getCourseStructure(courseId) {
    try {
      const modules = await this.getModules(courseId);
      const modulesWithLessons = await Promise.all(
        modules.map(async (mod) => {
          const lessons = await this.getLessons(mod.id);
          return { ...mod, lessons };
        })
      );
      return { modules: modulesWithLessons, totalLessons: modulesWithLessons.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) };
    } catch (err) {
      console.error('[LearningService.getCourseStructure]', err);
      return { modules: [], totalLessons: 0 };
    }
  }

  // ============================================
  // PROGRESSION
  // ============================================

  async getEnrollment(userId, courseId) {
    try {
      const enrollment = await this.enrollmentRepo.findByUserAndCourse(userId, courseId);
      return enrollment || null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Marque une lecon comme terminee et met a jour la progression.
   */
  async completeLesson(userId, courseId, lessonId) {
    try {
      const enrollmentId = `${userId}_${courseId}`;
      const enrollment = await this.enrollmentRepo.findById(enrollmentId);
      if (!enrollment) {
        return { success: false, error: 'Inscription introuvable.' };
      }

      // Charger la structure pour compter les lecons totales
      const structure = await this.getCourseStructure(courseId);
      const totalLessons = structure.totalLessons;

      // Ajouter la lecon aux completedLessons
      const completed = [...(enrollment.completedLessons || [])];
      if (!completed.includes(lessonId)) {
        completed.push(lessonId);
      }

      // Calculer la progression
      const progress = totalLessons > 0 ? Math.min(Math.round((completed.length / totalLessons) * 100), 100) : 0;

      // Trouver la lecon suivante
      let nextLessonId = '';
      let currentModuleId = enrollment.currentModuleId || '';
      outer: for (const mod of structure.modules) {
        for (let i = 0; i < mod.lessons.length; i++) {
          if (mod.lessons[i].id === lessonId && i + 1 < mod.lessons.length) {
            nextLessonId = mod.lessons[i + 1].id;
            currentModuleId = mod.id;
            break outer;
          }
        }
      }

      // Mettre a jour dans Firestore
      await this.enrollmentRepo.completeLesson(enrollmentId, lessonId, {
        completedLessons: completed,
        progress,
        currentModuleId: currentModuleId || enrollment.currentModuleId,
        currentLessonId: nextLessonId || lessonId,
        status: progress >= 100 ? 'completed' : 'active',
        completedAt: progress >= 100 ? new Date().toISOString() : null
      });

      return { success: true, progress, error: null };

    } catch (err) {
      console.error('[LearningService.completeLesson]', err);
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  /**
   * Trouve la lecon precedente et suivante pour la navigation.
   */
  async getLessonNavigation(courseId, currentLessonId) {
    const structure = await this.getCourseStructure(courseId);
    let prev = null, next = null, current = null;
    let found = false;

    outer: for (const mod of structure.modules) {
      for (let i = 0; i < mod.lessons.length; i++) {
        const lesson = mod.lessons[i];
        if (lesson.id === currentLessonId) {
          current = lesson;
          prev = i > 0 ? mod.lessons[i - 1] : null;
          next = i + 1 < mod.lessons.length ? mod.lessons[i + 1] : null;
          found = true;
          break outer;
        }
        if (!found && i === mod.lessons.length - 1 && mod === structure.modules[structure.modules.length - 1]) {
          // lesson not found, prev is last lesson
          prev = lesson;
        }
      }
    }

    return { current, prev, next };
  }

  // ============================================
  // TEACHER
  // ============================================

  async createModule(moduleId, data) {
    try {
      await this.moduleRepo.createModule(moduleId, data);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  async createLesson(lessonId, data) {
    try {
      await this.lessonRepo.createLesson(lessonId, data);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }
}

export const learningService = new LearningService();
