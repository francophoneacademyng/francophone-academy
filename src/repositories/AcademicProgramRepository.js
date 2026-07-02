/**
 * AcademicProgramRepository.js
 * Acces a la collection Firestore : academic_programs/{programId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';

export class AcademicProgramRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ACADEMIC_PROGRAMS);
  }

  async createProgram(programId, data) {
    return this.create(programId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async updateProgram(programId, updates) {
    return this.update(programId, updates);
  }
}
