/**
 * LiveClassRepository.js
 * Repository pour les cours en direct (Firestore)
 */

import { BaseRepository } from './BaseRepository.js';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db } from '../config/firebase.js';

export class LiveClassRepository extends BaseRepository {
  constructor() {
    super('live_classes');
  }

  /**
   * Crée un nouveau cours en direct.
   */
  async create(id, data) {
    const liveClass = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return super.create(id, liveClass);
  }

  /**
   * Met à jour un cours en direct.
   */
  async update(id, data) {
    const updates = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    return super.update(id, updates);
  }

  /**
   * Trouve tous les cours en direct d'un professeur.
   */
  async findByTeacher(teacherId) {
    return this.query(where('teacherId', '==', teacherId), orderBy('startDate', 'desc'));
  }

  /**
   * Trouve tous les cours en direct d'un cours.
   */
  async findByCourse(courseId) {
    return this.query(where('courseId', '==', courseId), orderBy('startDate', 'desc'));
  }

  /**
   * Trouve tous les cours en direct d'un niveau.
   */
  async findByLevel(level) {
    return this.query(where('level', '==', level), orderBy('startDate', 'desc'));
  }

  /**
   * Trouve les cours en direct à venir.
   */
  async findUpcoming(limit = 10) {
    const now = new Date().toISOString();
    return this.query(
      where('startDate', '>', now),
      where('status', '!=', 'cancelled'),
      orderBy('startDate', 'asc')
    );
  }

  /**
   * Trouve les cours en direct en cours.
   */
  async findLive() {
    const now = new Date().toISOString();
    return this.query(
      where('status', '==', 'in_progress'),
      orderBy('startDate', 'asc')
    );
  }

  /**
   * Trouve les cours complétés avec enregistrement.
   */
  async findWithRecordings() {
    return this.query(
      where('status', '==', 'completed'),
      where('recordingUrl', '!=', null),
      orderBy('endDate', 'desc')
    );
  }

  /**
   * Ajoute un participant à la liste de présence.
   */
  async addAttendance(liveClassId, studentId, joinedAt) {
    const liveClassRef = doc(db, 'live_classes', liveClassId);
    const liveClass = await this.findById(liveClassId);
    
    if (!liveClass) throw new Error('Cours en direct introuvable');

    const attendance = liveClass.attendance || [];
    
    // Vérifier si le participant est déjà enregistré
    const existing = attendance.find(a => a.studentId === studentId);
    if (!existing) {
      attendance.push({
        studentId,
        joinedAt: joinedAt || new Date().toISOString(),
        leftAt: null,
        duration: 0
      });
    }

    await updateDoc(liveClassRef, { attendance });
    return attendance;
  }

  /**
   * Enregistre le départ d'un participant.
   */
  async recordAttendanceExit(liveClassId, studentId, leftAt) {
    const liveClass = await this.findById(liveClassId);
    if (!liveClass) throw new Error('Cours en direct introuvable');

    const attendance = liveClass.attendance || [];
    const record = attendance.find(a => a.studentId === studentId);
    
    if (record) {
      record.leftAt = leftAt || new Date().toISOString();
      if (record.joinedAt) {
        const joined = new Date(record.joinedAt);
        const left = new Date(record.leftAt);
        record.duration = Math.floor((left - joined) / 60000); // minutes
      }
    }

    const liveClassRef = doc(db, 'live_classes', liveClassId);
    await updateDoc(liveClassRef, { attendance });
    return attendance;
  }

  /**
   * Ajoute un document au cours en direct.
   */
  async addDocument(liveClassId, documentData) {
    const liveClass = await this.findById(liveClassId);
    if (!liveClass) throw new Error('Cours en direct introuvable');

    const documents = liveClass.documents || [];
    documents.push({
      id: `doc_${Date.now()}`,
      name: documentData.name,
      url: documentData.url,
      type: documentData.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: documentData.uploadedBy
    });

    const liveClassRef = doc(db, 'live_classes', liveClassId);
    await updateDoc(liveClassRef, { documents });
    return documents;
  }

  /**
   * Supprime un document.
   */
  async removeDocument(liveClassId, documentId) {
    const liveClass = await this.findById(liveClassId);
    if (!liveClass) throw new Error('Cours en direct introuvable');

    let documents = liveClass.documents || [];
    documents = documents.filter(d => d.id !== documentId);

    const liveClassRef = doc(db, 'live_classes', liveClassId);
    await updateDoc(liveClassRef, { documents });
    return documents;
  }

  /**
   * Publié le recording URL.
   */
  async setRecording(liveClassId, recordingUrl) {
    const liveClassRef = doc(db, 'live_classes', liveClassId);
    await updateDoc(liveClassRef, {
      recordingUrl,
      status: 'completed',
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Annule un cours en direct.
   */
  async cancel(liveClassId, reason = '') {
    const liveClassRef = doc(db, 'live_classes', liveClassId);
    await updateDoc(liveClassRef, {
      status: 'cancelled',
      cancellationReason: reason,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Reporte un cours en direct.
   */
  async reschedule(liveClassId, newStartDate, newEndDate) {
    const liveClassRef = doc(db, 'live_classes', liveClassId);
    await updateDoc(liveClassRef, {
      startDate: newStartDate,
      endDate: newEndDate,
      status: 'scheduled',
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Change le statut.
   */
  async updateStatus(liveClassId, status) {
    const liveClassRef = doc(db, 'live_classes', liveClassId);
    await updateDoc(liveClassRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  }
}
