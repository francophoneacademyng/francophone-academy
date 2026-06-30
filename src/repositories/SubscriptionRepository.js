/**
 * SubscriptionRepository.js
 * Acces a la collection subscriptions/ dans Firestore.
 */

import { BaseRepository } from './BaseRepository.js';
import { where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class SubscriptionRepository extends BaseRepository {
  constructor() {
    super('subscriptions');
  }

  /** Trouve l'abonnement actif d'un utilisateur. */
  async findActiveByUser(userId) {
    const results = await this.query(
      where('userId', '==', userId),
      where('status', 'in', ['active', 'trial']),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    return results[0] || null;
  }

  /** Trouve tous les abonnements d'un utilisateur. */
  async findByUser(userId) {
    return this.query(
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }

  /** Compte les abonnements actifs par plan. */
  async countActiveByPlan(plan) {
    const results = await this.query(
      where('plan', '==', plan),
      where('status', 'in', ['active', 'trial'])
    );
    return results.length;
  }

  /** Liste les abonnements actifs (admin). */
  async findAllActive(maxResults = 100) {
    return this.query(
      where('status', 'in', ['active', 'trial']),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
  }

  /** Trouve les abonnements expirant bientot. */
  async findExpiringSoon(days = 7) {
    const future = new Date();
    future.setDate(future.getDate() + days);
    return this.query(
      where('status', '==', 'active'),
      where('endDate', '<=', future.toISOString()),
      orderBy('endDate', 'asc')
    );
  }
}
