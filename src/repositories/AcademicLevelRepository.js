/**
 * AcademicLevelRepository.js
 * Acces a la collection Firestore : academic_levels/{levelId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class AcademicLevelRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ACADEMIC_LEVELS);
  }

  async findByProgram(programId) {
    return this.query(where('programId', '==', programId), orderBy('order', 'asc'));
  }

  async createLevel(levelId, data) {
    return this.create(levelId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async updateLevel(levelId, updates) {
    return this.update(levelId, updates);
  }
}
