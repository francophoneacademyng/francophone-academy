/**
 * Payment.js
 * Modele de domaine pour un paiement.
 * Represente la structure de la collection Firestore : payments/{paymentId}
 */

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded'
};

export const PAYMENT_METHOD = {
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money',
  BANK_TRANSFER: 'bank_transfer',
  USSD: 'ussd'
};

export class Payment {
  constructor(data = {}) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.subscriptionId = data.subscriptionId || '';
    this.plan = data.plan || '';
    this.amount = data.amount || 0;
    this.currency = data.currency || 'XOF';
    this.status = data.status || PAYMENT_STATUS.PENDING;
    this.method = data.method || '';
    this.paystackRef = data.paystackRef || ''; // reference Paystack
    this.paystackTransactionId = data.paystackTransactionId || '';
    this.authorizationCode = data.authorizationCode || '';
    this.paidAt = data.paidAt || null;
    this.failedAt = data.failedAt || null;
    this.failReason = data.failReason || '';
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  static create(userId, plan, amount, currency = 'XOF') {
    return new Payment({
      userId,
      plan,
      amount,
      currency,
      status: PAYMENT_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  static fromFirestore(id, data) {
    return new Payment({ ...data, id });
  }

  toFirestore() {
    return {
      userId: this.userId,
      subscriptionId: this.subscriptionId,
      plan: this.plan,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      method: this.method,
      paystackRef: this.paystackRef,
      paystackTransactionId: this.paystackTransactionId,
      authorizationCode: this.authorizationCode,
      paidAt: this.paidAt,
      failedAt: this.failedAt,
      failReason: this.failReason,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  markSuccess(paystackRef, transactionId, method, authCode = '') {
    this.status = PAYMENT_STATUS.SUCCESS;
    this.paystackRef = paystackRef;
    this.paystackTransactionId = transactionId;
    this.method = method;
    this.authorizationCode = authCode;
    this.paidAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  markFailed(reason = '') {
    this.status = PAYMENT_STATUS.FAILED;
    this.failReason = reason;
    this.failedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  markRefunded(amount = null) {
    if (amount && amount < this.amount) {
      this.status = PAYMENT_STATUS.PARTIALLY_REFUNDED;
    } else {
      this.status = PAYMENT_STATUS.REFUNDED;
    }
    this.updatedAt = new Date().toISOString();
  }

  isSuccessful() {
    return this.status === PAYMENT_STATUS.SUCCESS;
  }
}
