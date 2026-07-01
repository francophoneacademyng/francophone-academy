/**
 * LiveClassService.js
 * Service métier pour les cours en direct
 */

import { LiveClassRepository } from '../repositories/LiveClassRepository.js';
import { LiveClass } from '../models/LiveClass.js';
import { translateFirebaseError } from '../utils/firebaseErrors.js';

export class LiveClassService {
  constructor() {
    this.repo = new LiveClassRepository();
  }

  // ============================================
  // CRUD
  // ============================================

  /**
   * Crée un nouveau cours en direct.
   */
  async createLiveClass(data) {
    try {
      // Valider les données
      const liveClass = new LiveClass(
        null,
        data.lessonId,
        data.teacherId,
        data.courseId,
        data.level || 'A1',
        data.title,
        data.description,
        data.meetingProvider,
        data.meetingUrl,
        data.meetingId,
        data.meetingPassword,
        data.startDate,
        data.endDate,
        data.duration,
        'scheduled',
        null,
        [],
        [],
        data.maxParticipants || 100,
        data.createdBy
      );

      const error = liveClass.validate();
      if (error) {
        return { liveClass: null, error };
      }

      const id = `lc_${data.teacherId}_${Date.now()}`;
      await this.repo.create(id, liveClass.toFirestore());

      return { liveClass: { ...liveClass.toFirestore(), id }, error: null };
    } catch (err) {
      return { liveClass: null, error: translateFirebaseError(err) };
    }
  }

  /**
   * Récupère un cours en direct.
   */
  async getLiveClass(liveClassId) {
    try {
      const data = await this.repo.findById(liveClassId);
      if (!data) return null;
      return LiveClass.fromFirestore(liveClassId, data);
    } catch (err) {
      console.error('[LiveClassService.getLiveClass]', err);
      return null;
    }
  }

  /**
   * Met à jour un cours en direct.
   */
  async updateLiveClass(liveClassId, updates) {
    try {
      const liveClass = await this.getLiveClass(liveClassId);
      if (!liveClass) {
        return { success: false, error: 'Cours en direct introuvable' };
      }

      // Mettre à jour les champs
      const updated = { ...liveClass, ...updates };
      const liveClassObj = new LiveClass(
        liveClassId,
        updated.lessonId,
        updated.teacherId,
        updated.courseId,
        updated.level,
        updated.title,
        updated.description,
        updated.meetingProvider,
        updated.meetingUrl,
        updated.meetingId,
        updated.meetingPassword,
        updated.startDate,
        updated.endDate,
        updated.duration,
        updated.status,
        updated.recordingUrl,
        updated.documents,
        updated.attendance,
        updated.maxParticipants,
        updated.createdBy,
        updated.createdAt,
        new Date().toISOString()
      );

      const error = liveClassObj.validate();
      if (error) {
        return { success: false, error };
      }

      await this.repo.update(liveClassId, liveClassObj.toFirestore());
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  /**
   * Supprime un cours en direct.
   */
  async deleteLiveClass(liveClassId) {
    try {
      await this.repo.delete(liveClassId);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Récupère les cours en direct d'un professeur.
   */
  async getTeacherLiveClasses(teacherId) {
    try {
      const classes = await this.repo.findByTeacher(teacherId);
      return classes.map(c => LiveClass.fromFirestore(c.id, c));
    } catch (err) {
      return [];
    }
  }

  /**
   * Récupère les cours en direct d'un cours.
   */
  async getCourseLiveClasses(courseId) {
    try {
      const classes = await this.repo.findByCourse(courseId);
      return classes.map(c => LiveClass.fromFirestore(c.id, c));
    } catch (err) {
      return [];
    }
  }

  /**
   * Récupère les cours à venir.
   */
  async getUpcomingLiveClasses(limit = 10) {
    try {
      const classes = await this.repo.findUpcoming(limit);
      return classes.slice(0, limit).map(c => LiveClass.fromFirestore(c.id, c));
    } catch (err) {
      return [];
    }
  }

  /**
   * Récupère les cours en direct en cours.
   */
  async getLiveLiveClasses() {
    try {
      const classes = await this.repo.findLive();
      return classes.map(c => LiveClass.fromFirestore(c.id, c));
    } catch (err) {
      return [];
    }
  }

  /**
   * Récupère les enregistrements disponibles.
   */
  async getRecordings(courseId = null) {
    try {
      const recordings = await this.repo.findWithRecordings();
      let filtered = recordings.map(r => LiveClass.fromFirestore(r.id, r));
      if (courseId) {
        filtered = filtered.filter(r => r.courseId === courseId);
      }
      return filtered;
    } catch (err) {
      return [];
    }
  }

  // ============================================
  // ATTENDANCE
  // ============================================

  /**
   * Marque un étudiant comme présent.
   */
  async markAttendance(liveClassId, studentId) {
    try {
      await this.repo.addAttendance(liveClassId, studentId);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  /**
   * Enregistre le départ d'un étudiant.
   */
  async recordExit(liveClassId, studentId) {
    try {
      await this.repo.recordAttendanceExit(liveClassId, studentId);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  /**
   * Récupère la liste de présence.
   */
  async getAttendance(liveClassId) {
    try {
      const liveClass = await this.getLiveClass(liveClassId);
      return liveClass ? liveClass.attendance || [] : [];
    } catch (err) {
      return [];
    }
  }

  // ============================================
  // DOCUMENTS
  // ============================================

  /**
   * Ajoute un document au cours.
   */
  async addDocument(liveClassId, documentData) {
    try {
      const documents = await this.repo.addDocument(liveClassId, documentData);
      return { documents, error: null };
    } catch (err) {
      return { documents: null, error: translateFirebaseError(err) };
    }
  }

  /**
   * Supprime un document.
   */
  async removeDocument(liveClassId, documentId) {
    try {
      const documents = await this.repo.removeDocument(liveClassId, documentId);
      return { documents, error: null };
    } catch (err) {
      return { documents: null, error: translateFirebaseError(err) };
    }
  }

  // ============================================
  // STATUS
  // ============================================

  /**
   * Démarre un cours en direct.
   */
  async startLiveClass(liveClassId) {
    try {
      await this.repo.updateStatus(liveClassId, 'in_progress');
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  /**
   * Termine un cours en direct.
   */
  async completeLiveClass(liveClassId, recordingUrl = null) {
    try {
      if (recordingUrl) {
        await this.repo.setRecording(liveClassId, recordingUrl);
      } else {
        await this.repo.updateStatus(liveClassId, 'completed');
      }
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  /**
   * Annule un cours en direct.
   */
  async cancelLiveClass(liveClassId, reason = '') {
    try {
      await this.repo.cancel(liveClassId, reason);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }

  /**
   * Reporte un cours en direct.
   */
  async rescheduleLiveClass(liveClassId, newStartDate, newEndDate) {
    try {
      await this.repo.reschedule(liveClassId, newStartDate, newEndDate);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: translateFirebaseError(err) };
    }
  }
}
