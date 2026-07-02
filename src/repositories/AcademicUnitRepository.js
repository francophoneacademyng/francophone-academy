/**
 * AcademicUnitRepository.js
 * Acces a la collection Firestore : academic_units/{unitId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class AcademicUnitRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ACADEMIC_UNITS);
  }

  async findByModule(moduleId) {
    return this.query(where('moduleId', '==', moduleId), orderBy('order', 'asc'));
  }

  async createUnit(unitId, data) {
    return this.create(unitId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async updateUnit(unitId, updates) {
    return this.update(unitId, updates);
  }
}
