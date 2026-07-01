/**
 * LiveClassController.js
 * Controller pour les cours en direct
 */

import { LiveClassService } from '../services/LiveClassService.js';
import { AuthController } from './AuthController.js';

export class LiveClassController {
  constructor() {
    this.service = new LiveClassService();
    this.view = null;
    this._liveClasses = [];
    this._currentLiveClass = null;
  }

  setView(view) {
    this.view = view;
  }

  // ============================================
  // AUTH
  // ============================================

  _getCurrentUser() {
    return AuthController.getCurrentUser();
  }

  _getUserId() {
    const user = this._getCurrentUser();
    return user?.uid || null;
  }

  _isTeacher() {
    const user = this._getCurrentUser();
    return user?.roles?.includes('teacher') || false;
  }

  // ============================================
  // LOAD
  // ============================================

  /**
   * Charge les cours à venir.
   */
  async loadUpcomingLiveClasses() {
    try {
      if (this.view) this.view.renderLoading('Chargement des cours en direct...');
      
      const liveClasses = await this.service.getUpcomingLiveClasses(20);
      this._liveClasses = liveClasses;
      
      if (this.view) {
        this.view.renderUpcoming(liveClasses);
      }
    } catch (err) {
      console.error('[LiveClassController.loadUpcomingLiveClasses]', err);
      if (this.view) this.view.showToast('Erreur au chargement des cours', 'error');
    }
  }

  /**
   * Charge les cours en direct en cours.
   */
  async loadLiveLiveClasses() {
    try {
      const liveClasses = await this.service.getLiveLiveClasses();
      this._liveClasses = liveClasses;
      
      if (this.view) {
        this.view.renderLive(liveClasses);
      }
    } catch (err) {
      console.error('[LiveClassController.loadLiveLiveClasses]', err);
    }
  }

  /**
   * Charge les cours d'un professeur.
   */
  async loadTeacherLiveClasses() {
    const userId = this._getUserId();
    if (!userId) return;

    try {
      if (this.view) this.view.renderLoading('Chargement vos cours...');
      
      const liveClasses = await this.service.getTeacherLiveClasses(userId);
      this._liveClasses = liveClasses;
      
      if (this.view) {
        this.view.renderTeacherList(liveClasses);
      }
    } catch (err) {
      console.error('[LiveClassController.loadTeacherLiveClasses]', err);
      if (this.view) this.view.showToast('Erreur au chargement', 'error');
    }
  }

  /**
   * Charge un cours spécifique.
   */
  async loadLiveClass(liveClassId) {
    try {
      if (this.view) this.view.renderLoading('Chargement du cours...');
      
      const liveClass = await this.service.getLiveClass(liveClassId);
      if (!liveClass) {
        if (this.view) this.view.showToast('Cours introuvable', 'error');
        return;
      }

      this._currentLiveClass = liveClass;
      if (this.view) {
        this.view.renderDetail(liveClass);
      }
    } catch (err) {
      console.error('[LiveClassController.loadLiveClass]', err);
      if (this.view) this.view.showToast('Erreur au chargement', 'error');
    }
  }

  /**
   * Charge les enregistrements.
   */
  async loadRecordings(courseId = null) {
    try {
      if (this.view) this.view.renderLoading('Chargement des enregistrements...');
      
      const recordings = await this.service.getRecordings(courseId);
      
      if (this.view) {
        this.view.renderRecordings(recordings);
      }
    } catch (err) {
      console.error('[LiveClassController.loadRecordings]', err);
    }
  }

  // ============================================
  // CREATE
  // ============================================

  /**
   * Crée un nouveau cours en direct.
   */
  async createLiveClass(data) {
    const userId = this._getUserId();
    if (!userId) {
      if (this.view) this.view.showToast('Vous devez être connecté', 'error');
      return;
    }

    try {
      if (this.view) this.view.showToast('Création du cours...', 'info');

      const result = await this.service.createLiveClass({
        ...data,
        teacherId: userId,
        createdBy: userId
      });

      if (result.error) {
        if (this.view) this.view.showToast(result.error, 'error');
        return;
      }

      if (this.view) {
        this.view.showToast('Cours créé avec succès !', 'success');
        this.view.closeModal?.();
      }

      this.loadTeacherLiveClasses();
    } catch (err) {
      console.error('[LiveClassController.createLiveClass]', err);
      if (this.view) this.view.showToast('Erreur à la création', 'error');
    }
  }

  // ============================================
  // UPDATE
  // ============================================

  /**
   * Met à jour un cours en direct.
   */
  async updateLiveClass(liveClassId, updates) {
    try {
      if (this.view) this.view.showToast('Mise à jour en cours...', 'info');

      const result = await this.service.updateLiveClass(liveClassId, updates);

      if (result.error) {
        if (this.view) this.view.showToast(result.error, 'error');
        return;
      }

      if (this.view) {
        this.view.showToast('Mise à jour réussie !', 'success');
      }

      this.loadLiveClass(liveClassId);
    } catch (err) {
      console.error('[LiveClassController.updateLiveClass]', err);
      if (this.view) this.view.showToast('Erreur à la mise à jour', 'error');
    }
  }

  /**
   * Supprime un cours en direct.
   */
  async deleteLiveClass(liveClassId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;

    try {
      const result = await this.service.deleteLiveClass(liveClassId);

      if (result.error) {
        if (this.view) this.view.showToast(result.error, 'error');
        return;
      }

      if (this.view) {
        this.view.showToast('Cours supprimé', 'success');
        this.view.goBack?.();
      }

      this.loadTeacherLiveClasses();
    } catch (err) {
      console.error('[LiveClassController.deleteLiveClass]', err);
      if (this.view) this.view.showToast('Erreur à la suppression', 'error');
    }
  }

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Démarre un cours en direct.
   */
  async startLiveClass(liveClassId) {
    try {
      const result = await this.service.startLiveClass(liveClassId);

      if (result.error) {
        if (this.view) this.view.showToast(result.error, 'error');
        return;
      }

      if (this.view) this.view.showToast('Cours démarré !', 'success');
      this.loadLiveClass(liveClassId);
    } catch (err) {
      console.error('[LiveClassController.startLiveClass]', err);
      if (this.view) this.view.showToast('Erreur au démarrage', 'error');
    }
  }

  /**
   * Termine un cours en direct.
   */
  async completeLiveClass(liveClassId, recordingUrl = null) {
    try {
      const result = await this.service.completeLiveClass(liveClassId, recordingUrl);

      if (result.error) {
        if (this.view) this.view.showToast(result.error, 'error');
        return;
      }

      if (this.view) {
        this.view.showToast('Cours terminé !', 'success');
      }

      this.loadLiveClass(liveClassId);
    } catch (err) {
      console.error('[LiveClassController.completeLiveClass]', err);
      if (this.view) this.view.showToast('Erreur à la fin du cours', 'error');
    }
  }

  /**
   * Annule un cours en direct.
   */
  async cancelLiveClass(liveClassId, reason = '') {
    try {
      const result = await this.service.cancelLiveClass(liveClassId, reason);

      if (result.error) {
        if (this.view) this.view.showToast(result.error, 'error');
        return;
      }

      if (this.view) this.view.showToast('Cours annulé', 'success');
      this.loadTeacherLiveClasses();
    } catch (err) {
      console.error('[LiveClassController.cancelLiveClass]', err);
      if (this.view) this.view.showToast('Erreur à l\'annulation', 'error');
    }
  }

  /**
   * Reporte un cours en direct.
   */
  async rescheduleLiveClass(liveClassId, newStartDate, newEndDate) {
    try {
      const result = await this.service.rescheduleLiveClass(liveClassId, newStartDate, newEndDate);

      if (result.error) {
        if (this.view) this.view.showToast(result.error, 'error');
        return;
      }

      if (this.view) this.view.showToast('Cours reporté avec succès', 'success');
      this.loadLiveClass(liveClassId);
    } catch (err) {
      console.error('[LiveClassController.rescheduleLiveClass]', err);
      if (this.view) this.view.showToast('Erreur au report', 'error');
    }
  }

  /**
   * Rejoins un cours en direct.
   */
  async joinLiveClass(liveClassId) {
    const userId = this._getUserId();
    if (!userId) {
      if (this.view) this.view.showToast('Vous devez être connecté', 'error');
      return;
    }

    try {
      const result = await this.service.markAttendance(liveClassId, userId);

      if (result.error) {
        if (this.view) this.view.showToast(result.error, 'error');
        return;
      }

      if (this.view) this.view.showToast('Vous avez rejoint le cours', 'success');
    } catch (err) {
      console.error('[LiveClassController.joinLiveClass]', err);
      if (this.view) this.view.showToast('Erreur à la connexion', 'error');
    }
  }

  /**
   * Quitte un cours en direct.
   */
  async leaveLiveClass(liveClassId) {
    const userId = this._getUserId();
    if (!userId) return;

    try {
      const result = await this.service.recordExit(liveClassId, userId);

      if (result.error) {
        console.error('[LiveClassController.leaveLiveClass]', result.error);
        return;
      }

      if (this.view) this.view.showToast('Vous avez quitté le cours', 'info');
    } catch (err) {
      console.error('[LiveClassController.leaveLiveClass]', err);
    }
  }

  /**
   * Charge la liste de présence.
   */
  async loadAttendance(liveClassId) {
    try {
      const attendance = await this.service.getAttendance(liveClassId);
      
      if (this.view) {
        this.view.renderAttendance(attendance);
      }
    } catch (err) {
      console.error('[LiveClassController.loadAttendance]', err);
    }
  }

  /**
   * Ajoute un document.
   */
  async addDocument(liveClassId, documentData) {
    try {
      const result = await this.service.addDocument(liveClassId, documentData);

      if (result.error) {
        if (this.view) this.view.showToast(result.error, 'error');
        return;
      }

      if (this.view) {
        this.view.showToast('Document ajouté', 'success');
        this.view.refreshDocuments?.(result.documents);
      }
    } catch (err) {
      console.error('[LiveClassController.addDocument]', err);
      if (this.view) this.view.showToast('Erreur à l\'ajout', 'error');
    }
  }

  /**
   * Supprime un document.
   */
  async removeDocument(liveClassId, documentId) {
    try {
      const result = await this.service.removeDocument(liveClassId, documentId);

      if (result.error) {
        if (this.view) this.view.showToast(result.error, 'error');
        return;
      }

      if (this.view) {
        this.view.showToast('Document supprimé', 'success');
        this.view.refreshDocuments?.(result.documents);
      }
    } catch (err) {
      console.error('[LiveClassController.removeDocument]', err);
      if (this.view) this.view.showToast('Erreur à la suppression', 'error');
    }
  }
}
