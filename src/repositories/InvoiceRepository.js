/**
 * InvoiceRepository.js
 * Acces a la collection invoices/ dans Firestore.
 */

import { BaseRepository } from './BaseRepository.js';
import { where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class InvoiceRepository extends BaseRepository {
  constructor() {
    super('invoices');
  }

  /** Trouve les factures d'un utilisateur. */
  async findByUser(userId, maxResults = 50) {
    return this.query(
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
  }

  /** Trouve une facture par numero. */
  async findByNumber(invoiceNumber) {
    const results = await this.query(where('invoiceNumber', '==', invoiceNumber), limit(1));
    return results[0] || null;
  }

  /** Trouve par paiement. */
  async findByPayment(paymentId) {
    const results = await this.query(where('paymentId', '==', paymentId), limit(1));
    return results[0] || null;
  }

  /** Factures par periode (admin). */
  async findByPeriod(startDate, endDate) {
    return this.query(
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );
  }
}
