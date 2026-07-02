/**
 * AcademicCertificateRepository.js
 * Acces a la collection Firestore : academic_certificates/{certificateId}
 */

import { BaseRepository } from './BaseRepository.js';
import { COLLECTIONS } from '../config/firebase.js';
import { where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class AcademicCertificateRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.ACADEMIC_CERTIFICATES);
  }

  async findByLevel(levelId) {
    return this.query(where('levelId', '==', levelId), orderBy('createdAt', 'asc'));
  }

  async createCertificate(certificateId, data) {
    return this.create(certificateId, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async updateCertificate(certificateId, updates) {
    return this.update(certificateId, updates);
  }
}
