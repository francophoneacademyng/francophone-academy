/**
 * LessonRepository.js
 * Acces a la collection Firestore : lessons/{lessonId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class LessonRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.LESSONS);
  }

  async findByModule(moduleId) {
    return this.query(
      where('moduleId', '==', moduleId),
      orderBy('order', 'asc')
    );
  }

  async findByCourse(courseId) {
    return this.query(
      where('courseId', '==', courseId),
      orderBy('order', 'asc')
    );
  }

  async findPublishedByModule(moduleId) {
    return this.query(
      where('moduleId', '==', moduleId),
      where('status', '==', 'published'),
      orderBy('order', 'asc')
    );
  }

  async createLesson(lessonId, data) {
    return this.create(lessonId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}
