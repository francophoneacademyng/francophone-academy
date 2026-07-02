/**
 * AcademicModuleRepository.js
 * Acces a la collection Firestore : academic_modules/{moduleId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class AcademicModuleRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ACADEMIC_MODULES);
  }

  async findByLevel(levelId) {
    return this.query(where('levelId', '==', levelId), orderBy('order', 'asc'));
  }

  async createModule(moduleId, data) {
    return this.create(moduleId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async updateModule(moduleId, updates) {
    return this.update(moduleId, updates);
  }
}
