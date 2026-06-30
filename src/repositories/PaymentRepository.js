/**
 * PaymentRepository.js
 * Acces a la collection payments/ dans Firestore.
 */

import { BaseRepository } from './BaseRepository.js';
import { where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class PaymentRepository extends BaseRepository {
  constructor() {
    super('payments');
  }

  /** Trouve les paiements d'un utilisateur. */
  async findByUser(userId, maxResults = 50) {
    return this.query(
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
  }

  /** Trouve un paiement par reference Paystack. */
  async findByPaystackRef(ref) {
    const results = await this.query(where('paystackRef', '==', ref), limit(1));
    return results[0] || null;
  }

  /** Trouve les paiements reussis d'un utilisateur. */
  async findSuccessfulByUser(userId) {
    return this.query(
      where('userId', '==', userId),
      where('status', '==', 'success'),
      orderBy('createdAt', 'desc')
    );
  }

  /** Total des revenus (admin). */
  async getTotalRevenue() {
    const payments = await this.query(where('status', '==', 'success'));
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }

  /** Revenus par periode (admin). */
  async getRevenueByPeriod(startDate, endDate) {
    return this.query(
      where('status', '==', 'success'),
      where('paidAt', '>=', startDate),
      where('paidAt', '<=', endDate)
    );
  }
}
