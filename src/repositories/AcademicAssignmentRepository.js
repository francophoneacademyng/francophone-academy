/**
 * AcademicAssignmentRepository.js
 * Acces a la collection Firestore : academic_assignments/{assignmentId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class AcademicAssignmentRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ACADEMIC_ASSIGNMENTS);
  }

  async findByUnit(unitId) {
    return this.query(where('unitId', '==', unitId), orderBy('createdAt', 'asc'));
  }

  async createAssignment(assignmentId, data) {
    return this.create(assignmentId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async updateAssignment(assignmentId, updates) {
    return this.update(assignmentId, updates);
  }
}
