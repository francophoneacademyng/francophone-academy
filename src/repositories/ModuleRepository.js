/**
 * ModuleRepository.js
 * Acces a la collection Firestore : modules/{moduleId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class ModuleRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.MODULES);
  }

  async findByCourse(courseId) {
    return this.query(
      where('courseId', '==', courseId),
      orderBy('order', 'asc')
    );
  }

  async findPublishedByCourse(courseId) {
    return this.query(
      where('courseId', '==', courseId),
      where('status', '==', 'published'),
      orderBy('order', 'asc')
    );
  }

  async createModule(moduleId, data) {
    return this.create(moduleId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}
