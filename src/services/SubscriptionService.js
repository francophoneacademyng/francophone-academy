/**
 * SubscriptionService.js
 * Gestion des plans d'abonnement et des souscriptions.
 *
 * Controller -> SubscriptionService -> SubscriptionRepository + PaymentRepository
 */

import { SubscriptionRepository } from '../repositories/SubscriptionRepository.js';
import { PaymentRepository } from '../repositories/PaymentRepository.js';
import { InvoiceRepository } from '../repositories/InvoiceRepository.js';
import { TransactionRepository } from '../repositories/TransactionRepository.js';
import { Subscription, SUBSCRIPTION_STATUS } from '../models/Subscription.js';
import { Payment } from '../models/Payment.js';
import { Transaction, TRANSACTION_TYPE } from '../models/Transaction.js';
import { Invoice } from '../models/Invoice.js';
import { PLAN_FEATURES } from '../config/firebase.js';
import { translateFirebaseError } from '../utils/firebaseErrors.js';

export class SubscriptionService {
  constructor() {
    this.subRepo = new SubscriptionRepository();
    this.payRepo = new PaymentRepository();
    this.invRepo = new InvoiceRepository();
    this.txnRepo = new TransactionRepository();
  }

  // ============================================
  // PLANS
  // ============================================

  /** Retourne tous les plans disponibles. */
  getPlans() {
    return Object.entries(PLAN_FEATURES).map(([key, plan]) => ({
      key,
      ...plan
    }));
  }

  /** Retourne un plan par cle. */
  getPlan(planKey) {
    return PLAN_FEATURES[planKey] || PLAN_FEATURES.free;
  }

  // ============================================
  // ABONNEMENT
  // ============================================

  /**
   * Cree ou recupere l'abonnement d'un utilisateur.
   * @param {string} userId
   * @returns {Promise<{subscription: Subscription, isNew: boolean, error: string|null}>}
   */
  async getOrCreateSubscription(userId) {
    try {
      let sub = await this.subRepo.findActiveByUser(userId);
      if (sub) {
        const subscription = Subscription.fromFirestore(sub.id, sub);
        // Verifier expiration
        if (!subscription.isActive() && subscription.status === SUBSCRIPTION_STATUS.ACTIVE) {
          subscription.expire();
          await this.subRepo.update(sub.id, subscription.toFirestore());
        }
        return { subscription, isNew: false, error: null };
      }

      // Creer un abonnement gratuit par defaut
      const newSub = Subscription.create(userId, 'free');
      await this.subRepo.create(newSub.id, newSub.toFirestore());
      return { subscription: newSub, isNew: true, error: null };

    } catch (err) {
      console.error('[SubscriptionService.getOrCreateSubscription]', err);
      return { subscription: Subscription.create(userId, 'free'), isNew: true, error: translateFirebaseError(err) };
    }
  }

  /**
   * Souscrit a un plan (apres paiement reussi).
   * @param {string} userId
   * @param {string} planKey
   * @param {string} duration
   * @param {Payment} payment
   * @returns {Promise<{subscription: Subscription|null, error: string|null}>}
   */
  async subscribe(userId, planKey, duration, payment) {
    try {
      // Desactiver l'ancien abonnement s'il existe
      const oldSub = await this.subRepo.findActiveByUser(userId);
      if (oldSub && oldSub.id) {
        await this.subRepo.update(oldSub.id, { status: 'cancelled', updatedAt: new Date().toISOString() });
      }

      // Creer le nouvel abonnement
      const subscription = Subscription.create(userId, planKey, duration);
      subscription.activate(payment.paystackRef);
      subscription.paymentMethod = payment.method;
      subscription.subscriptionId = payment.subscriptionId || '';
      await this.subRepo.create(subscription.id, subscription.toFirestore());

      // Creer la transaction
      const txn = Transaction.fromPayment(payment, TRANSACTION_TYPE.PAYMENT);
      txn.subscriptionId = subscription.id;
      await this.txnRepo.create(txn.id, txn.toFirestore());

      // Mettre a jour le paiement avec l'ID d'abonnement
      await this.payRepo.update(payment.id, { subscriptionId: subscription.id });

      return { subscription, error: null };

    } catch (err) {
      console.error('[SubscriptionService.subscribe]', err);
      return { subscription: null, error: translateFirebaseError(err) };
    }
  }

  /**
   * Annule un abonnement.
   */
  async cancelSubscription(subscriptionId, reason = '') {
    try {
      const data = await this.subRepo.findById(subscriptionId);
      if (!data) return { error: 'Abonnement introuvable' };

      const sub = Subscription.fromFirestore(subscriptionId, data);
      sub.cancel(reason);
      await this.subRepo.update(subscriptionId, sub.toFirestore());
      return { error: null };

    } catch (err) {
      return { error: translateFirebaseError(err) };
    }
  }

  /**
   * Renouvelle un abonnement.
   */
  async renewSubscription(subscriptionId, payment) {
    try {
      const data = await this.subRepo.findById(subscriptionId);
      if (!data) return { error: 'Abonnement introuvable' };

      const sub = Subscription.fromFirestore(subscriptionId, data);

      // Prolonger la date de fin
      const endDate = new Date(sub.endDate || new Date());
      if (sub.duration === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
      else endDate.setMonth(endDate.getMonth() + 1);
      sub.endDate = endDate.toISOString();
      sub.status = SUBSCRIPTION_STATUS.ACTIVE;
      sub.activate(payment.paystackRef);
      await this.subRepo.update(subscriptionId, sub.toFirestore());

      // Transaction de renouvellement
      const txn = Transaction.fromPayment(payment, TRANSACTION_TYPE.RENEWAL);
      txn.subscriptionId = subscriptionId;
      await this.txnRepo.create(txn.id, txn.toFirestore());

      return { subscription: sub, error: null };

    } catch (err) {
      return { subscription: null, error: translateFirebaseError(err) };
    }
  }

  /**
   * Verifie et met a jour les abonnements expires.
   */
  async checkExpiredSubscriptions() {
    try {
      const expiring = await this.subRepo.findExpiringSoon(0); // deja expires
      for (const subData of expiring) {
        const sub = Subscription.fromFirestore(subData.id, subData);
        if (sub.isActive()) continue; // Pas encore expire
        sub.expire();
        await this.subRepo.update(subData.id, sub.toFirestore());
      }
      return expiring.length;
    } catch (err) {
      return 0;
    }
  }

  // ============================================
  // FACTURES
  // ============================================

  /**
   * Genere une facture pour un paiement.
   */
  async generateInvoice(payment, user) {
    try {
      const existing = await this.invRepo.findByPayment(payment.id);
      if (existing) return { invoice: Invoice.fromFirestore(existing.id, existing), error: null };

      const invoice = Invoice.fromPayment(payment, user);
      await this.invRepo.create(invoice.id, invoice.toFirestore());
      return { invoice, error: null };

    } catch (err) {
      return { invoice: null, error: translateFirebaseError(err) };
    }
  }

  /**
   * Charge les factures d'un utilisateur.
   */
  async getUserInvoices(userId) {
    try {
      const invoices = await this.invRepo.findByUser(userId);
      return invoices.map(i => Invoice.fromFirestore(i.id, i).toDashboardFormat());
    } catch (err) {
      return [];
    }
  }

  // ============================================
  // STATS UTILISATEUR
  // ============================================

  /**
   * Charge les stats d'abonnement pour le dashboard.
   */
  async getUserSubscriptionStats(userId) {
    try {
      const [subData, payments, invoices] = await Promise.all([
        this.subRepo.findActiveByUser(userId),
        this.payRepo.findSuccessfulByUser(userId),
        this.invRepo.findByUser(userId, 10)
      ]);

      const subscription = subData ? Subscription.fromFirestore(subData.id, subData) : null;

      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        plan: subscription?.plan || 'free',
        planName: Subscription.getPlanDisplayName(subscription?.plan || 'free'),
        status: subscription?.status || 'active',
        isActive: subscription?.isActive() || true,
        startDate: subscription?.startDate || null,
        endDate: subscription?.endDate || null,
        daysRemaining: subscription?.getDaysRemaining() || -1,
        autoRenew: subscription?.autoRenew || false,
        totalPaid,
        currency: subscription?.currency || 'XOF',
        paymentCount: payments.length,
        invoices: invoices.map(i => Invoice.fromFirestore(i.id, i).toDashboardFormat()),
        features: subscription?.features || PLAN_FEATURES.free.features
      };

    } catch (err) {
      return this._defaultStats();
    }
  }

  // ============================================
  // STATS ADMIN
  // ============================================

  /**
   * Stats financieres pour le teacher/admin dashboard.
   */
  async getAdminStats() {
    try {
      const [activeSubs, totalRevenue, allPayments] = await Promise.all([
        this.subRepo.findAllActive(1000),
        this.payRepo.getTotalRevenue(),
        this.payRepo.query(where('status', '==', 'success'))
      ]);

      const byPlan = {};
      for (const planKey of Object.keys(PLAN_FEATURES)) {
        byPlan[planKey] = activeSubs.filter(s => s.plan === planKey).length;
      }

      // Par mois
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthlyPayments = allPayments.filter(p => p.paidAt >= thisMonthStart);
      const monthlyRevenue = monthlyPayments.reduce((s, p) => s + (p.amount || 0), 0);

      return {
        activeSubscriptions: activeSubs.length,
        totalRevenue,
        monthlyRevenue,
        totalPayments: allPayments.length,
        byPlan,
        recentPayments: allPayments.slice(0, 10).map(p => ({
          amount: p.amount,
          currency: p.currency,
          plan: p.plan,
          status: p.status,
          date: p.paidAt || p.createdAt
        }))
      };

    } catch (err) {
      return { activeSubscriptions: 0, totalRevenue: 0, monthlyRevenue: 0, totalPayments: 0, byPlan: {}, recentPayments: [] };
    }
  }

  _defaultStats() {
    return {
      plan: 'free', planName: 'Free', status: 'active', isActive: true,
      startDate: null, endDate: null, daysRemaining: -1, autoRenew: false,
      totalPaid: 0, currency: 'XOF', paymentCount: 0, invoices: [],
      features: PLAN_FEATURES.free.features
    };
  }
}

export const subscriptionService = new SubscriptionService();
