/**
 * CourseRepository.js
 * Acces a la collection Firestore : courses/{courseId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * @class CourseRepository
 * Repository pour les cours.
 */
export class CourseRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.COURSES);
  }

  async findById(courseId) {
    return super.findById(courseId);
  }

  async findPublished() {
    return this.query(where('status', '==', 'published'), orderBy('order', 'asc'));
  }

  async findByCategory(category) {
    return this.query(
      where('status', '==', 'published'),
      where('category', '==', category),
      orderBy('order', 'asc')
    );
  }

  async findByLevel(level) {
    return this.query(
      where('status', '==', 'published'),
      where('level', '==', level),
      orderBy('order', 'asc')
    );
  }

  async findByInstructor(instructorId) {
    return this.query(
      where('instructorId', '==', instructorId),
      orderBy('createdAt', 'desc')
    );
  }

  async createCourse(courseId, data) {
    return this.create(courseId, {
      ...data,
      status: data.status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async updateCourse(courseId, updates) {
    return this.update(courseId, updates);
  }

  async publish(courseId) {
    return this.update(courseId, {
      status: 'published',
      publishedAt: new Date().toISOString()
    });
  }

  async archive(courseId) {
    return this.update(courseId, { status: 'archived' });
  }
}
