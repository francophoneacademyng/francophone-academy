/**
 * CertificateRepository.js
 * Acces a la collection certificates/ dans Firestore.
 */

import { BaseRepository } from './BaseRepository.js';
import { where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class CertificateRepository extends BaseRepository {
  constructor() {
    super('certificates');
  }

  /** Trouve les certificats d'un utilisateur. */
  async findByUser(userId, maxResults = 50) {
    return this.query(
      where('userId', '==', userId),
      orderBy('issueDate', 'desc'),
      limit(maxResults)
    );
  }

  /** Trouve un certificat par son numero unique. */
  async findByNumber(certificateNumber) {
    const results = await this.query(where('certificateNumber', '==', certificateNumber), limit(1));
    return results[0] || null;
  }

  /** Trouve le certificat pour un cours specifique. */
  async findByCourse(userId, courseId) {
    const results = await this.query(
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      limit(1)
    );
    return results[0] || null;
  }

  /** Compte les certificats actifs d'un utilisateur. */
  async countByUser(userId) {
    const certs = await this.findByUser(userId);
    return certs.filter(c => c.status === 'active').length;
  }

  /** Liste tous les certificats actifs (admin). */
  async findAllActive(maxResults = 100) {
    return this.query(
      where('status', '==', 'active'),
      orderBy('issueDate', 'desc'),
      limit(maxResults)
    );
  }

  /** Certificats recents pour le dashboard admin. */
  async findRecent(maxResults = 10) {
    return this.query(
      orderBy('issueDate', 'desc'),
      limit(maxResults)
    );
  }
}
