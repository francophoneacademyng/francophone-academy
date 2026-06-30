/**
 * PaymentController.js
 * Controller pour les paiements et abonnements.
 * Gere le flux complet : selection plan -> paiement Paystack -> activation.
 */

import { aiService } from '../services/AIService.js';
import { AuthController } from './AuthController.js';

export class PaymentController {
  constructor() {
    this.view = null;
    this._userId = null;
    this._selectedPlan = null;
    this._selectedDuration = 'monthly';
  }

  setView(view) {
    this.view = view;
  }

  _getUserId() {
    if (!this._userId) {
      const user = AuthController.getCurrentUser();
      this._userId = user?.uid || null;
    }
    return this._userId;
  }

  _getUserEmail() {
    const user = AuthController.getCurrentUser();
    return user?.email || '';
  }

  _getUserName() {
    const user = AuthController.getCurrentUser();
    return user?.displayName || '';
  }

  // ============================================
  // PLANS
  // ============================================

  /** Charge les plans disponibles. */
  async loadPlans() {
    return aiService.getSubscriptionPlans();
  }

  /** Charge l'abonnement courant de l'utilisateur. */
  async loadCurrentSubscription() {
    const userId = this._getUserId();
    if (!userId) return null;
    return aiService.getUserSubscription(userId);
  }

  // ============================================
  // PAIEMENT
  // ============================================

  /**
   * Selectionne un plan et demarre le paiement.
   * @param {string} planKey
   * @param {string} duration — monthly | yearly
   */
  async onSelectPlan(planKey, duration = 'monthly') {
    const userId = this._getUserId();
    const email = this._getUserEmail();
    if (!userId) {
      this.view?.showToast?.('Veuillez vous connecter', 'error');
      return;
    }
    if (!email) {
      this.view?.showToast?.('Email requis pour le paiement', 'error');
      return;
    }

    this._selectedPlan = planKey;
    this._selectedDuration = duration;

    const plan = await aiService.getPlanDetails(planKey);
    if (!plan) {
      this.view?.showToast?.('Plan introuvable', 'error');
      return;
    }

    // Plan gratuit -> activation directe
    if (plan.price === 0) {
      this.view?.renderLoading?.('Activation du plan gratuit...');
      const result = await aiService.processDemoPayment(userId, planKey, duration);
      if (result.success) {
        this.view?.showToast?.('Plan gratuit active !', 'success');
        this.view?.onPaymentSuccess?.(result.subscription, result.payment);
      } else {
        this.view?.showToast?.(result.error || 'Erreur', 'error');
      }
      return;
    }

    // Plan payant -> Paystack
    this.view?.renderLoading?.('Ouverture du paiement securise...');

    const { reference, error } = await aiService.initiatePaystackPayment({
      email,
      amount: plan.price,
      metadata: { userId, planKey, duration },
      onClose: () => {
        this.view?.showToast?.('Paiement annule', 'info');
        this.view?.onPaymentCancelled?.();
      }
    });

    if (error || !reference) {
      this.view?.showToast?.(error || 'Paiement annule', 'error');
      this.view?.onPaymentFailed?.(error || 'Annule');
      return;
    }

    // Verifier et traiter le paiement
    this.view?.renderLoading?.('Verification du paiement...');
    const result = await aiService.verifyPayment(reference, userId, planKey, duration);

    if (result.success) {
      this.view?.showToast?.('Paiement reussi ! Abonnement active.', 'success');
      this.view?.onPaymentSuccess?.(result.subscription, result.payment, result.invoice);
    } else {
      this.view?.showToast?.(result.error || 'Verification echouee', 'error');
      this.view?.onPaymentFailed?.(result.error);
    }
  }

  // ============================================
  // ABONNEMENT
  // ============================================

  /** Charge les stats d'abonnement pour le dashboard. */
  async loadSubscriptionStats() {
    const userId = this._getUserId();
    if (!userId) return null;
    return aiService.getUserSubscriptionStats(userId);
  }

  /** Annule l'abonnement courant. */
  async onCancelSubscription(subscriptionId, reason = '') {
    const { error } = await aiService.cancelSubscription(subscriptionId, reason);
    if (error) {
      this.view?.showToast?.(error, 'error');
    } else {
      this.view?.showToast?.('Abonnement annule', 'info');
      this.view?.onSubscriptionCancelled?.();
    }
  }

  // ============================================
  // FACTURES
  // ============================================

  /** Charge les factures de l'utilisateur. */
  async loadInvoices() {
    const userId = this._getUserId();
    if (!userId) return [];
    return aiService.getUserInvoices(userId);
  }

  /** Genere une facture pour un paiement. */
  async onGenerateInvoice(paymentId) {
    const user = { displayName: this._getUserName(), email: this._getUserEmail() };
    const { invoice, error } = await aiService.generateInvoice(paymentId, user);
    if (error) {
      this.view?.showToast?.(error, 'error');
    } else if (invoice) {
      this.view?.showInvoice?.(invoice);
    }
  }

  // ============================================
  // ADMIN
  // ============================================

  /** Stats financieres pour le dashboard admin. */
  async loadFinancialStats() {
    return aiService.getFinancialStats();
  }

  /** Liste des paiements pour l'admin. */
  async loadAllPayments() {
    return aiService.getPaymentHistory(this._getUserId());
  }
}
