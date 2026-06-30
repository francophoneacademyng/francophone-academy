/**
 * Transaction.js
 * Modele de domaine pour une transaction financiere.
 * Represente la structure de la collection Firestore : transactions/{transactionId}
 * Immuable — enregistre historiquement chaque mouvement financier.
 */

export const TRANSACTION_TYPE = {
  PAYMENT: 'payment',
  REFUND: 'refund',
  RENEWAL: 'renewal',
  UPGRADE: 'upgrade',
  DOWNGRADE: 'downgrade',
  CANCELLATION: 'cancellation'
};

export const TRANSACTION_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  FAILED: 'failed',
  REVERSED: 'reversed'
};

export class Transaction {
  constructor(data = {}) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.paymentId = data.paymentId || '';
    this.subscriptionId = data.subscriptionId || '';
    this.type = data.type || TRANSACTION_TYPE.PAYMENT;
    this.status = data.status || TRANSACTION_STATUS.COMPLETED;
    this.amount = data.amount || 0;
    this.currency = data.currency || 'XOF';
    this.plan = data.plan || '';
    this.description = data.description || '';
    this.paystackRef = data.paystackRef || '';
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  static fromPayment(payment, type = TRANSACTION_TYPE.PAYMENT) {
    return new Transaction({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: payment.userId,
      paymentId: payment.id,
      type,
      status: payment.isSuccessful() ? TRANSACTION_STATUS.COMPLETED : TRANSACTION_STATUS.FAILED,
      amount: payment.amount,
      currency: payment.currency,
      plan: payment.plan,
      description: `Paiement ${type} — Plan ${payment.plan}`,
      paystackRef: payment.paystackRef,
      createdAt: new Date().toISOString()
    });
  }

  static fromFirestore(id, data) {
    return new Transaction({ ...data, id });
  }

  toFirestore() {
    return {
      userId: this.userId,
      paymentId: this.paymentId,
      subscriptionId: this.subscriptionId,
      type: this.type,
      status: this.status,
      amount: this.amount,
      currency: this.currency,
      plan: this.plan,
      description: this.description,
      paystackRef: this.paystackRef,
      metadata: this.metadata,
      createdAt: this.createdAt
    };
  }
}
