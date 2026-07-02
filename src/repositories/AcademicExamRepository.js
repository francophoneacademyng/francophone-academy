/**
 * AcademicExamRepository.js
 * Acces a la collection Firestore : academic_exams/{examId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class AcademicExamRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ACADEMIC_EXAMS);
  }

  async findByLevel(levelId) {
    return this.query(where('levelId', '==', levelId), orderBy('createdAt', 'asc'));
  }

  async createExam(examId, data) {
    return this.create(examId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async updateExam(examId, updates) {
    return this.update(examId, updates);
  }
}
