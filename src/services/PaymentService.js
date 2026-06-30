/**
 * PaymentService.js
 * Integration Paystack et gestion des paiements.
 *
 * Controller -> PaymentService -> Repositories + Paystack API
 *
 * Architecture Paystack :
 * 1. Client initie le paiement via Paystack Inline (popup JS)
 * 2. Apres succes, verifyTransaction() verifie le statut
 * 3. Enregistrement dans Firestore (payments/, transactions/, invoices/)
 * 4. Activation de l'abonnement
 *
 * SECURITE : La cle publique Paystack est exposee (necessaire pour Inline).
 * La verification finale DOIT etre faite par Cloud Functions en production.
 */

import { PaymentRepository } from '../repositories/PaymentRepository.js';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository.js';
import { TransactionRepository } from '../repositories/TransactionRepository.js';
import { InvoiceRepository } from '../repositories/InvoiceRepository.js';
import { Payment, PAYMENT_STATUS } from '../models/Payment.js';
import { Subscription } from '../models/Subscription.js';
import { Transaction, TRANSACTION_TYPE } from '../models/Transaction.js';
import { Invoice } from '../models/Invoice.js';
import { PAYSTACK_CONFIG, PLAN_FEATURES } from '../config/firebase.js';
import { translateFirebaseError } from '../utils/firebaseErrors.js';

// ============================================
// PAYSTACK API HELPERS
// ============================================

const PAYSTACK_API = 'https://api.paystack.co';

/**
 * Verifie une transaction Paystack.
 * NOTE : En production, cet appel DOIT passer par des Cloud Functions
 * pour ne pas exposer la cle secrete.
 */
async function verifyPaystackTransaction(reference) {
  try {
    // AVEC CLE SECRETE (MVP uniquement — remplacer par Cloud Function en production)
    const secretKey = PAYSTACK_CONFIG.SECRET_KEY || '';
    if (!secretKey) {
      // Mode demo : simuler une verification reussie
      console.warn('[PaymentService] Mode demo — aucune cle Paystack configuree');
      return {
        status: true,
        data: {
          status: 'success',
          reference,
          amount: 0,
          gateway_response: 'Demo payment',
          channel: 'card',
          authorization: { authorization_code: '' }
        }
      };
    }

    const response = await fetch(`${PAYSTACK_API}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` }
    });
    return await response.json();

  } catch (err) {
    console.error('[PaymentService.verifyPaystackTransaction]', err);
    return { status: false, message: err.message };
  }
}

// ============================================
// PAYMENT SERVICE
// ============================================

export class PaymentService {
  constructor() {
    this.payRepo = new PaymentRepository();
    this.subRepo = new SubscriptionRepository();
    this.txnRepo = new TransactionRepository();
    this.invRepo = new InvoiceRepository();
    this._paystackLoaded = false;
  }

  // ============================================
  // PAYSTACK INLINE
  // ============================================

  /**
   * Charge le script Paystack Inline.
   */
  async loadPaystackScript() {
    if (this._paystackLoaded) return;
    return new Promise((resolve, reject) => {
      if (window.PaystackPop) {
        this._paystackLoaded = true;
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => { this._paystackLoaded = true; resolve(); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Initie un paiement via Paystack Inline.
   * @param {Object} params — {email, amount, metadata, onSuccess, onClose }
   * @returns {Promise<{reference: string|null, error: string|null}>}
   */
  async initiatePayment({ email, amount, metadata = {}, onSuccess, onClose }) {
    try {
      await this.loadPaystackScript();

      // Convertir en kobo/centimes (Paystack attend la plus petite unite)
      const amountInSmallestUnit = amount; // XOF est en unite directe

      return new Promise((resolve) => {
        const handler = window.PaystackPop.setup({
          key: PAYSTACK_CONFIG.PUBLIC_KEY,
          email,
          amount: amountInSmallestUnit,
          currency: PAYSTACK_CONFIG.CURRENCY,
          channels: PAYSTACK_CONFIG.CHANNELS,
          metadata,
          onClose: () => {
            if (onClose) onClose();
            resolve({ reference: null, error: 'Paiement annule' });
          },
          callback: (response) => {
            if (onSuccess) onSuccess(response.reference);
            resolve({ reference: response.reference, error: null });
          }
        });
        handler.openIframe();
      });

    } catch (err) {
      return { reference: null, error: err.message || 'Erreur Paystack' };
    }
  }

  // ============================================
  // VERIFICATION & ENREGISTREMENT
  // ============================================

  /**
   * Verifie un paiement Paystack et enregistre tout.
   * C'est la methode cle appelee apres le retour de Paystack.
   * @param {string} reference — Reference Paystack
   * @param {string} userId
   * @param {string} planKey
   * @param {string} duration
   * @returns {Promise<{success: boolean, payment: Payment|null, subscription: Subscription|null, invoice: Invoice|null, error: string|null}>}
   */
  async verifyAndProcessPayment(reference, userId, planKey, duration = 'monthly') {
    try {
      // 1. Verifier la transaction Paystack
      const verifyResult = await verifyPaystackTransaction(reference);

      if (!verifyResult.status || verifyResult.data?.status !== 'success') {
        // Paiement echoue — enregistrer l'echec
        const failedPayment = Payment.create(userId, planKey, PLAN_FEATURES[planKey]?.price || 0);
        failedPayment.paystackRef = reference;
        failedPayment.markFailed(verifyResult.message || 'Verification echouee');
        await this.payRepo.create(failedPayment.id, failedPayment.toFirestore());
        return { success: false, payment: failedPayment, subscription: null, invoice: null, error: 'Paiement non valide' };
      }

      const psData = verifyResult.data;

      // 2. Verifier si ce paiement n'est pas deja enregistre
      const existing = await this.payRepo.findByPaystackRef(reference);
      if (existing) {
        const existingPayment = Payment.fromFirestore(existing.id, existing);
        if (existingPayment.isSuccessful()) {
          return { success: true, payment: existingPayment, subscription: null, invoice: null, error: null };
        }
      }

      // 3. Creer le paiement
      const amount = psData.amount || PLAN_FEATURES[planKey]?.price || 0;
      const payment = Payment.create(userId, planKey, amount);
      payment.paystackRef = reference;
      payment.paystackTransactionId = String(psData.id || '');
      payment.markSuccess(
        reference,
        String(psData.id || ''),
        psData.channel || 'card',
        psData.authorization?.authorization_code || ''
      );
      await this.payRepo.create(payment.id, payment.toFirestore());

      // 4. Desactiver l'ancien abonnement
      const oldSub = await this.subRepo.findActiveByUser(userId);
      if (oldSub?.id) {
        await this.subRepo.update(oldSub.id, { status: 'cancelled', updatedAt: new Date().toISOString() });
      }

      // 5. Creer le nouvel abonnement
      const subscription = Subscription.create(userId, planKey, duration);
      subscription.activate(reference);
      subscription.paymentMethod = psData.channel || 'card';
      await this.subRepo.create(subscription.id, subscription.toFirestore());

      // 6. Mettre a jour le paiement avec l'ID d'abonnement
      payment.subscriptionId = subscription.id;
      await this.payRepo.update(payment.id, { subscriptionId: subscription.id });

      // 7. Creer la transaction
      const txn = Transaction.fromPayment(payment, TRANSACTION_TYPE.PAYMENT);
      txn.subscriptionId = subscription.id;
      await this.txnRepo.create(txn.id, txn.toFirestore());

      // 8. Generer la facture
      const user = { displayName: '', email: '' }; // Simplifie — recupere dans le controller
      const { invoice } = await this._createInvoice(payment, user);

      return { success: true, payment, subscription, invoice, error: null };

    } catch (err) {
      console.error('[PaymentService.verifyAndProcessPayment]', err);
      return { success: false, payment: null, subscription: null, invoice: null, error: translateFirebaseError(err) };
    }
  }

  /**
   * Enregistre un paiement en mode demo (sans Paystack).
   * Pour les tests et le plan gratuit.
   */
  async processDemoPayment(userId, planKey, duration = 'monthly') {
    try {
      const plan = PLAN_FEATURES[planKey];
      const amount = plan?.price || 0;

      // Creer le paiement
      const payment = Payment.create(userId, planKey, amount);
      payment.paystackRef = `demo_${Date.now()}`;
      payment.method = 'demo';
      if (amount === 0) {
        payment.markSuccess(payment.paystackRef, 'demo', 'demo');
      } else {
        payment.markFailed('Demo — paiement reel requis');
      }
      await this.payRepo.create(payment.id, payment.toFirestore());

      if (amount > 0) {
        return { success: false, payment, subscription: null, invoice: null, error: 'Paiement reel requis pour ce plan' };
      }

      // Activer l'abonnement gratuit
      const oldSub = await this.subRepo.findActiveByUser(userId);
      if (oldSub?.id) {
        await this.subRepo.update(oldSub.id, { status: 'cancelled', updatedAt: new Date().toISOString() });
      }

      const subscription = Subscription.create(userId, planKey, duration);
      subscription.activate(payment.paystackRef);
      subscription.paymentMethod = 'demo';
      await this.subRepo.create(subscription.id, subscription.toFirestore());

      payment.subscriptionId = subscription.id;
      await this.payRepo.update(payment.id, { subscriptionId: subscription.id });

      const txn = Transaction.fromPayment(payment, TRANSACTION_TYPE.PAYMENT);
      txn.subscriptionId = subscription.id;
      await this.txnRepo.create(txn.id, txn.toFirestore());

      return { success: true, payment, subscription, invoice: null, error: null };

    } catch (err) {
      return { success: false, payment: null, subscription: null, invoice: null, error: translateFirebaseError(err) };
    }
  }

  // ============================================
  // FACTURES
  // ============================================

  async _createInvoice(payment, user) {
    try {
      const existing = await this.invRepo.findByPayment(payment.id);
      if (existing) return { invoice: Invoice.fromFirestore(existing.id, existing) };

      const invoice = Invoice.fromPayment(payment, user);
      await this.invRepo.create(invoice.id, invoice.toFirestore());
      return { invoice };
    } catch (err) {
      return { invoice: null };
    }
  }

  /**
   * Cree une facture avec les infos utilisateur completes.
   */
  async generateInvoice(paymentId, user) {
    try {
      const paymentData = await this.payRepo.findById(paymentId);
      if (!paymentData) return { invoice: null, error: 'Paiement introuvable' };

      const payment = Payment.fromFirestore(paymentData.id, paymentData);
      return this._createInvoice(payment, user);

    } catch (err) {
      return { invoice: null, error: translateFirebaseError(err) };
    }
  }

  // ============================================
  // HISTORIQUE
  // ============================================

  /** Charge l'historique des paiements d'un utilisateur. */
  async getPaymentHistory(userId) {
    try {
      const payments = await this.payRepo.findByUser(userId);
      return payments.map(p => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        plan: p.plan,
        status: p.status,
        method: p.method,
        date: p.paidAt || p.createdAt,
        reference: p.paystackRef
      }));
    } catch (err) {
      return [];
    }
  }

  /** Charge les transactions d'un utilisateur. */
  async getTransactionHistory(userId) {
    try {
      return await this.txnRepo.findByUser(userId);
    } catch (err) {
      return [];
    }
  }

  // ============================================
  // ADMIN STATS
  // ============================================

  /** Stats pour le dashboard admin. */
  async getFinancialStats() {
    try {
      const [totalRevenue, allPayments] = await Promise.all([
        this.payRepo.getTotalRevenue(),
        this.payRepo.query(where('status', '==', 'success'))
      ]);

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthlyPayments = allPayments.filter(p => p.paidAt >= thisMonthStart);
      const monthlyRevenue = monthlyPayments.reduce((s, p) => s + (p.amount || 0), 0);

      return {
        totalRevenue,
        monthlyRevenue,
        totalPayments: allPayments.length,
        averageOrder: allPayments.length > 0 ? Math.round(totalRevenue / allPayments.length) : 0,
        recentTransactions: allPayments.slice(0, 10).map(p => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          plan: p.plan,
          date: p.paidAt || p.createdAt,
          reference: p.paystackRef
        }))
      };
    } catch (err) {
      return { totalRevenue: 0, monthlyRevenue: 0, totalPayments: 0, averageOrder: 0, recentTransactions: [] };
    }
  }
}

// Import where for queries
import { where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export const paymentService = new PaymentService();
