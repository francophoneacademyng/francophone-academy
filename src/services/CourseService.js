/**
 * CourseService.js
 * Service pour la gestion du catalogue de cours et des inscriptions.
 *
 * Controller -> CourseService -> CourseRepository + EnrollmentRepository
 */

import { CourseRepository } from '../repositories/CourseRepository.js';
import { EnrollmentRepository } from '../repositories/EnrollmentRepository.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { translateFirebaseError } from '../utils/firebaseErrors.js';

/**
 * Donnees de demonstration pour le catalogue quand Firestore est vide.
 */
const DEFAULT_COURSES = [
  {
    id: 'fr-general-a1', title: 'Francais General A1',
    description: 'Apprenez les bases du francais : salutations, presentations, nombres, et expressions quotidiennes. Ce cours couvre tout le programme A1 du CECRL.',
    shortDescription: 'Les bases du francais pour debutants',
    imageUrl: '', category: 'general', level: 'A1',
    duration: 1800, price: 0, currency: 'EUR',
    moduleCount: 6, lessonCount: 24, quizCount: 6,
    instructorName: 'Equipe FA', tags: ['debutant', 'grammaire', 'vocabulaire'],
    objectives: ['Se saluer', 'Se presenter', 'Poser des questions simples'],
    order: 1
  },
  {
    id: 'fr-general-a2', title: 'Francais General A2',
    description: 'Developpez vos competences en francais : passe compose, futur proche, et conversations de la vie quotidienne. Programme complet A2 CECRL.',
    shortDescription: 'Developpez vos competences quotidiennes',
    imageUrl: '', category: 'general', level: 'A2',
    duration: 2400, price: 0, currency: 'EUR',
    moduleCount: 8, lessonCount: 32, quizCount: 8,
    instructorName: 'Equipe FA', tags: ['elementaire', 'conjugaison'],
    objectives: ['Raconter un souvenir', 'Decrire un objet', 'Exprimer un souhait'],
    order: 2
  },
  {
    id: 'fr-pro-b1', title: 'Francais Professionnel B1',
    description: 'Maitrisez le francais dans un contexte professionnel : emails, reunions, presentations et negociations.',
    shortDescription: 'Francais pour le monde du travail',
    imageUrl: '', category: 'professional', level: 'B1',
    duration: 1500, price: 4900, currency: 'XOF',
    moduleCount: 5, lessonCount: 20, quizCount: 5,
    instructorName: 'Equipe FA', tags: ['professionnel', 'business'],
    objectives: ['Rediger un email professionnel', 'Participer a une reunion', 'Faire un entretien'],
    order: 3
  },
  {
    id: 'prep-delf-b1', title: 'Preparation DELF B1',
    description: 'Preparez le diplome DELF B1 avec des examens blancs, des strategies et des exercices cibles.',
    shortDescription: 'Passez votre DELF B1 en confiance',
    imageUrl: '', category: 'delf', level: 'B1',
    duration: 1200, price: 9900, currency: 'XOF',
    moduleCount: 4, lessonCount: 16, quizCount: 8,
    instructorName: 'Equipe FA', tags: ['certification', 'delf'],
    objectives: ['Comprendre les epreuves DELF', 'S\'entrainer aux examens blancs', 'Acquerir des strategies'],
    order: 4
  },
  {
    id: 'prep-dalf-c1', title: 'Preparation DALF C1',
    description: 'Atteignez le niveau C1 et preparez le DALF avec des exercices avances de comprehension et expression.',
    shortDescription: 'Atteignez la maitrise du francais',
    imageUrl: '', category: 'dalf', level: 'C1',
    duration: 1800, price: 14900, currency: 'XOF',
    moduleCount: 6, lessonCount: 24, quizCount: 10,
    instructorName: 'Equipe FA', tags: ['certification', 'dalf', 'avance'],
    objectives: ['Analyser des textes complexes', 'Produire un essai argumente', 'Comprendre des conferences'],
    order: 5
  },
  {
    id: 'prep-tcf', title: 'Preparation TCF Canada',
    description: 'Preparez le TCF Canada pour l\'immigration avec des simulations completes et des corrections detaillees.',
    shortDescription: 'TCF Canada pour l\'immigration',
    imageUrl: '', category: 'tcf', level: 'B2',
    duration: 1600, price: 12900, currency: 'XOF',
    moduleCount: 5, lessonCount: 20, quizCount: 8,
    instructorName: 'Equipe FA', tags: ['tcf', 'canada', 'immigration'],
    objectives: ['Maitriser les 4 competences evaluees', 'S\'entrainer avec des examens blancs', 'Optimiser son score'],
    order: 6
  },
  {
    id: 'prep-tef', title: 'Preparation TEF',
    description: 'Preparez le Test d\'Evaluation de Francais avec des exercices types et des strategies pour chaque epreuve.',
    shortDescription: 'Passez le TEF avec succes',
    imageUrl: '', category: 'tef', level: 'B2',
    duration: 1400, price: 12900, currency: 'XOF',
    moduleCount: 4, lessonCount: 16, quizCount: 6,
    instructorName: 'Equipe FA', tags: ['tef', 'evaluation'],
    objectives: ['Comprendre le format du TEF', 'S\'entrainer a chaque epreuve', 'Gerer son temps'],
    order: 7
  },
  {
    id: 'fr-general-b1', title: 'Francais General B1',
    description: 'Devenez independant en francais : expressions idiomatiques, subjonctif, et conversations spontanees.',
    shortDescription: 'Devenez independant en francais',
    imageUrl: '', category: 'general', level: 'B1',
    duration: 3000, price: 0, currency: 'EUR',
    moduleCount: 10, lessonCount: 40, quizCount: 10,
    instructorName: 'Equipe FA', tags: ['intermediaire', 'expression'],
    objectives: ['Tenir une conversation spontanee', 'Comprendre un film', 'Ecrire une lettre'],
    order: 8
  }
];

export class CourseService {
  constructor() {
    this.courseRepo = new CourseRepository();
    this.enrollmentRepo = new EnrollmentRepository();
  }

  // ============================================
  // CATALOGUE
  // ============================================

  /**
   * Liste tous les cours publies.
   * Retourne les cours par defaut si Firestore est vide.
   */
  async getCatalog() {
    try {
      let courses = await this.courseRepo.findPublished();
      if (courses.length === 0) {
        // Charger les cours par defaut
        for (const courseData of DEFAULT_COURSES) {
          const { id, ...data } = courseData;
          await this.courseRepo.createCourse(id, { ...data, status: 'published' });
        }
        courses = await this.courseRepo.findPublished();
      }
      return courses.map(c => Course.fromFirestore(c.id, c));
    } catch (err) {
      console.error('[CourseService.getCatalog]', err);
      return DEFAULT_COURSES.map(c => Course.fromFirestore(c.id, c));
    }
  }

  async getByCategory(category) {
    try {
      const courses = await this.courseRepo.findByCategory(category);
      return courses.map(c => Course.fromFirestore(c.id, c));
    } catch (err) {
      return DEFAULT_COURSES
        .filter(c => c.category === category)
        .map(c => Course.fromFirestore(c.id, c));
    }
  }

  async getByLevel(level) {
    try {
      const courses = await this.courseRepo.findByLevel(level);
      return courses.map(c => Course.fromFirestore(c.id, c));
    } catch (err) {
      return DEFAULT_COURSES
        .filter(c => c.level === level)
        .map(c => Course.fromFirestore(c.id, c));
    }
  }

  async getById(courseId) {
    try {
      const data = await this.courseRepo.findById(courseId);
      if (!data) return null;
      return Course.fromFirestore(data.id, data);
    } catch (err) {
      const found = DEFAULT_COURSES.find(c => c.id === courseId);
      return found ? Course.fromFirestore(found.id, found) : null;
    }
  }

  // ============================================
  // INSCRIPTION
  // ============================================

  /**
   * Inscrit un utilisateur a un cours.
   * Verifie qu'il n'est pas deja inscrit.
   */
  async enroll(userId, courseId) {
    try {
      // Verifier si deja inscrit
      const existing = await this.enrollmentRepo.findByUserAndCourse(userId, courseId);
      if (existing && existing.status !== 'archived') {
        return { enrollment: existing, error: 'Vous etes deja inscrit a ce cours.' };
      }

      // Charger le cours pour le titre
      const course = await this.getById(courseId);
      if (!course) {
        return { enrollment: null, error: 'Cours introuvable.' };
      }

      // Creer l'inscription
      const enrollment = Enrollment.create(userId, course);
      const enrollmentId = `${userId}_${courseId}`;
      await this.enrollmentRepo.createEnrollment(enrollmentId, enrollment.toFirestore());

      return { enrollment: { ...enrollment.toFirestore(), id: enrollmentId }, error: null };

    } catch (err) {
      console.error('[CourseService.enroll]', err);
      return { enrollment: null, error: translateFirebaseError(err) };
    }
  }

  /**
   * Verifie si un utilisateur est inscrit a un cours.
   */
  async isEnrolled(userId, courseId) {
    try {
      return await this.enrollmentRepo.isEnrolled(userId, courseId);
    } catch (err) {
      return false;
    }
  }

  /**
   * Liste les cours d'un utilisateur avec progression.
   */
  async getUserCourses(userId) {
    try {
      const enrollments = await this.enrollmentRepo.findByUser(userId);
      if (enrollments.length === 0) return [];

      // Charger les details de chaque cours
      const userCourses = await Promise.all(
        enrollments.map(async (en) => {
          const course = await this.getById(en.courseId);
          return {
            enrollment: en,
            course: course ? {
              id: course.id,
              title: course.title,
              level: course.level,
              category: course.category,
              duration: course.duration,
              moduleCount: course.moduleCount,
              lessonCount: course.lessonCount
            } : null
          };
        })
      );

      return userCourses.filter(uc => uc.course !== null);
    } catch (err) {
      console.error('[CourseService.getUserCourses]', err);
      return [];
    }
  }

  // ============================================
  // TEACHER
  // ============================================

  async createCourse(courseId, data) {
    try {
      await this.courseRepo.createCourse(courseId, data);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  async updateCourse(courseId, updates) {
    try {
      await this.courseRepo.updateCourse(courseId, updates);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  async publishCourse(courseId) {
    try {
      await this.courseRepo.publish(courseId);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  async archiveCourse(courseId) {
    try {
      await this.courseRepo.archive(courseId);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  async getTeacherCourses(instructorId) {
    try {
      const courses = await this.courseRepo.findByInstructor(instructorId);
      return courses.map(c => Course.fromFirestore(c.id, c));
    } catch (err) {
      return [];
    }
  }
}

export const courseService = new CourseService();
