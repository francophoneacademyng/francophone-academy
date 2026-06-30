/**
 * TransactionRepository.js
 * Acces a la collection transactions/ dans Firestore.
 */

import { BaseRepository } from './BaseRepository.js';
import { where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class TransactionRepository extends BaseRepository {
  constructor() {
    super('transactions');
  }

  /** Trouve les transactions d'un utilisateur. */
  async findByUser(userId, maxResults = 50) {
    return this.query(
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
  }

  /** Trouve les transactions par paiement. */
  async findByPayment(paymentId) {
    return this.query(where('paymentId', '==', paymentId));
  }

  /** Stats par type (admin). */
  async countByType(type) {
    const results = await this.query(where('type', '==', type));
    return results.length;
  }

  /** Total par periode (admin). */
  async getTotalsByPeriod(startDate, endDate) {
    return this.query(
      where('status', '==', 'completed'),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );
  }
}
