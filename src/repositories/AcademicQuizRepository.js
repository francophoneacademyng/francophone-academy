/**
 * AcademicQuizRepository.js
 * Acces a la collection Firestore : academic_quizzes/{quizId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class AcademicQuizRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ACADEMIC_QUIZZES);
  }

  async findByLesson(lessonId) {
    return this.query(where('lessonId', '==', lessonId), orderBy('createdAt', 'asc'));
  }

  async createQuiz(quizId, data) {
    return this.create(quizId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async updateQuiz(quizId, updates) {
    return this.update(quizId, updates);
  }
}
