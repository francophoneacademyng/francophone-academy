/**
 * Invoice.js
 * Modele de domaine pour une facture.
 * Represente la structure de la collection Firestore : invoices/{invoiceId}
 */

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

export class Invoice {
  constructor(data = {}) {
    this.id = data.id || '';
    this.invoiceNumber = data.invoiceNumber || '';
    this.userId = data.userId || '';
    this.userName = data.userName || '';
    this.userEmail = data.userEmail || '';
    this.paymentId = data.paymentId || '';
    this.subscriptionId = data.subscriptionId || '';
    this.plan = data.plan || '';
    this.planName = data.planName || '';
    this.status = data.status || INVOICE_STATUS.DRAFT;
    this.items = data.items || []; // [{description, quantity, unitPrice, total}]
    this.subtotal = data.subtotal || 0;
    this.taxRate = data.taxRate || 0;
    this.taxAmount = data.taxAmount || 0;
    this.total = data.total || 0;
    this.currency = data.currency || 'XOF';
    this.notes = data.notes || '';
    this.dueDate = data.dueDate || null;
    this.paidAt = data.paidAt || null;
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  static fromPayment(payment, user) {
    const now = new Date();
    const invoiceNumber = `FA-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    return new Invoice({
      id: `inv_${payment.id}`,
      invoiceNumber,
      userId: payment.userId,
      userName: user?.displayName || '',
      userEmail: user?.email || '',
      paymentId: payment.id,
      plan: payment.plan,
      planName: payment.plan,
      status: INVOICE_STATUS.PAID,
      items: [{
        description: `Abonnement ${payment.plan}`,
        quantity: 1,
        unitPrice: payment.amount,
        total: payment.amount
      }],
      subtotal: payment.amount,
      taxRate: 0,
      taxAmount: 0,
      total: payment.amount,
      currency: payment.currency,
      notes: 'Merci pour votre confiance !',
      paidAt: payment.paidAt || now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
  }

  static fromFirestore(id, data) {
    return new Invoice({ ...data, id });
  }

  toFirestore() {
    return {
      invoiceNumber: this.invoiceNumber,
      userId: this.userId,
      userName: this.userName,
      userEmail: this.userEmail,
      paymentId: this.paymentId,
      subscriptionId: this.subscriptionId,
      plan: this.plan,
      planName: this.planName,
      status: this.status,
      items: this.items,
      subtotal: this.subtotal,
      taxRate: this.taxRate,
      taxAmount: this.taxAmount,
      total: this.total,
      currency: this.currency,
      notes: this.notes,
      dueDate: this.dueDate,
      paidAt: this.paidAt,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  toPDFContent() {
    return {
      title: `Facture ${this.invoiceNumber}`,
      body: `
        Facture N° : ${this.invoiceNumber}
        Date : ${new Date(this.createdAt).toLocaleDateString('fr-FR')}
        Client : ${this.userName}
        Email : ${this.userEmail}

        Abonnement : ${this.planName}
        Montant : ${this.total} ${this.currency}
        Statut : ${this.status}

        ${this.notes}
      `
    };
  }

  toDashboardFormat() {
    return {
      id: this.id,
      invoiceNumber: this.invoiceNumber,
      plan: this.planName,
      total: this.total,
      currency: this.currency,
      status: this.status,
      date: this.paidAt || this.createdAt
    };
  }
}
