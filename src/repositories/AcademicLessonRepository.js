/**
 * AcademicLessonRepository.js
 * Acces a la collection Firestore : academic_lessons/{lessonId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class AcademicLessonRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ACADEMIC_LESSONS);
  }

  async findByUnit(unitId) {
    return this.query(where('unitId', '==', unitId), orderBy('order', 'asc'));
  }

  async createLesson(lessonId, data) {
    return this.create(lessonId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async updateLesson(lessonId, updates) {
    return this.update(lessonId, updates);
  }
}
