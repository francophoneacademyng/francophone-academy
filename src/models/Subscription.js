/**
 * Subscription.js
 * Modele de domaine pour un abonnement.
 * Represente la structure de la collection Firestore : subscriptions/{subscriptionId}
 */

import { SUBSCRIPTION_PLANS, PLAN_FEATURES } from '../config/firebase.js';

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  TRIAL: 'trial',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
};

export class Subscription {
  constructor(data = {}) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.plan = data.plan || SUBSCRIPTION_PLANS.FREE;
    this.status = data.status || SUBSCRIPTION_STATUS.ACTIVE;
    this.price = data.price || 0;
    this.currency = data.currency || 'XOF';
    this.duration = data.duration || 'monthly'; // monthly, yearly
    this.startDate = data.startDate || new Date().toISOString();
    this.endDate = data.endDate || null;
    this.trialEndsAt = data.trialEndsAt || null;
    this.autoRenew = data.autoRenew ?? true;
    this.paymentMethod = data.paymentMethod || '';
    this.lastPaymentAt = data.lastPaymentAt || null;
    this.nextPaymentAt = data.nextPaymentAt || null;
    this.cancelledAt = data.cancelledAt || null;
    this.cancelReason = data.cancelReason || '';
    this.features = data.features || [];
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  static create(userId, planKey, duration = 'monthly') {
    const plan = PLAN_FEATURES[planKey] || PLAN_FEATURES.free;
    const now = new Date();
    const endDate = new Date(now);
    if (duration === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    return new Subscription({
      userId,
      plan: planKey,
      status: planKey === 'free' ? SUBSCRIPTION_STATUS.ACTIVE : SUBSCRIPTION_STATUS.PENDING,
      price: plan.price,
      currency: plan.currency,
      duration,
      startDate: now.toISOString(),
      endDate: planKey === 'free' ? null : endDate.toISOString(),
      features: plan.features,
      autoRenew: planKey !== 'free',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
  }

  static fromFirestore(id, data) {
    return new Subscription({ ...data, id });
  }

  toFirestore() {
    return {
      userId: this.userId,
      plan: this.plan,
      status: this.status,
      price: this.price,
      currency: this.currency,
      duration: this.duration,
      startDate: this.startDate,
      endDate: this.endDate,
      trialEndsAt: this.trialEndsAt,
      autoRenew: this.autoRenew,
      paymentMethod: this.paymentMethod,
      lastPaymentAt: this.lastPaymentAt,
      nextPaymentAt: this.nextPaymentAt,
      cancelledAt: this.cancelledAt,
      cancelReason: this.cancelReason,
      features: this.features,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  activate(paymentRef = '') {
    this.status = SUBSCRIPTION_STATUS.ACTIVE;
    this.lastPaymentAt = new Date().toISOString();
    // Calculer nextPaymentAt
    const next = new Date();
    if (this.duration === 'yearly') next.setFullYear(next.getFullYear() + 1);
    else next.setMonth(next.getMonth() + 1);
    this.nextPaymentAt = next.toISOString();
    this.updatedAt = new Date().toISOString();
    if (paymentRef) this.metadata.lastPaymentRef = paymentRef;
  }

  cancel(reason = '') {
    this.status = SUBSCRIPTION_STATUS.CANCELLED;
    this.cancelledAt = new Date().toISOString();
    this.cancelReason = reason;
    this.autoRenew = false;
    this.updatedAt = new Date().toISOString();
  }

  expire() {
    this.status = SUBSCRIPTION_STATUS.EXPIRED;
    this.updatedAt = new Date().toISOString();
  }

  isActive() {
    if (this.status !== SUBSCRIPTION_STATUS.ACTIVE && this.status !== SUBSCRIPTION_STATUS.TRIAL) return false;
    if (this.endDate && new Date(this.endDate) < new Date()) {
      this.status = SUBSCRIPTION_STATUS.EXPIRED;
      return false;
    }
    return true;
  }

  getDaysRemaining() {
    if (!this.endDate) return -1;
    const diff = new Date(this.endDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getPlanDetails() {
    return PLAN_FEATURES[this.plan] || PLAN_FEATURES.free;
  }

  canAccessCourse(courseLevel) {
    if (!this.isActive()) return false;
    const planLimits = this.getPlanDetails();
    return true; // Simplifie — la logique reelle verifierait le nombre de cours actifs
  }

  static getPlanDisplayName(planKey) {
    return PLAN_FEATURES[planKey]?.name || planKey;
  }
}
