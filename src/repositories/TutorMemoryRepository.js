/**
 * TutorMemoryRepository.js
 * Acces a la collection tutor_memory/{userId} dans Firestore.
 */

import { BaseRepository } from './BaseRepository.js';

export class TutorMemoryRepository extends BaseRepository {
  constructor() {
    super('tutor_memory');
  }

  async findByUser(userId) {
    return this.findById(userId);
  }

  async create(userId, data) {
    return super.create(userId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async updateMemory(userId, updates) {
    return this.update(userId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}
