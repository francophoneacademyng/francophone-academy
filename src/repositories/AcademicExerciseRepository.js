/**
 * AcademicExerciseRepository.js
 * Acces a la collection Firestore : academic_exercises/{exerciseId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class AcademicExerciseRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ACADEMIC_EXERCISES);
  }

  async findByLesson(lessonId) {
    return this.query(where('lessonId', '==', lessonId), orderBy('createdAt', 'asc'));
  }

  async createExercise(exerciseId, data) {
    return this.create(exerciseId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async updateExercise(exerciseId, updates) {
    return this.update(exerciseId, updates);
  }
}
