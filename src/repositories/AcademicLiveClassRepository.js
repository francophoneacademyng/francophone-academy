/**
 * AcademicLiveClassRepository.js
 * Acces a la collection Firestore : academic_live_classes/{liveClassId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class AcademicLiveClassRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ACADEMIC_LIVE_CLASSES);
  }

  async findByLevel(levelId) {
    return this.query(where('levelId', '==', levelId), orderBy('createdAt', 'asc'));
  }

  async createLiveClass(liveClassId, data) {
    return this.create(liveClassId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async updateLiveClass(liveClassId, updates) {
    return this.update(liveClassId, updates);
  }
}
