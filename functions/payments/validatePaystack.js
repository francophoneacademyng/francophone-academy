/**
 * validatePaystack.js
 * Validation securisee des paiements Paystack cote serveur.
 * AUCUNE validation de paiement ne doit etre faite cote client.
 */

const axios = require('axios');
const { db, COLLECTIONS, SECRETS } = require('../config/firebaseAdmin');
const { logPayment, logSecurity, logError } = require('../shared/logger');
const { isValidUid, isValidPaystackRef, isValidPlan, validatePaymentRequest } = require('../shared/validators');

const PAYSTACK_API = 'https://api.paystack.co';

/**
 * Verifie une transaction Paystack aupres de l'API Paystack.
 * Cette fonction est la SEULE source de verite pour la validation.
 */
async function verifyPaystackTransaction(reference) {
  if (!SECRETS.PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY non configure');
  }

  const response = await axios.get(`${PAYSTACK_API}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${SECRETS.PAYSTACK_SECRET_KEY}` },
    timeout: 10000
  });

  return response.data;
}

/**
 * Processus complet de validation et d'activation post-paiement.
 * Appele par la Cloud Function HTTPS.
 */
async function processPaymentValidation(data, context) {
  // 1. Verifier authentification
  if (!context.auth) {
    await logSecurity('payment_noAuth', '', { reference: data.reference });
    throw new Error('Authentification requise');
  }

  const userId = context.auth.uid;

  // 2. Valider les donnees
  const validation = validatePaymentRequest(data);
  if (!validation.valid) {
    await logSecurity('payment_invalidData', userId, { errors: validation.errors });
    throw new Error(`Donnees invalides: ${validation.errors.join(', ')}`);
  }

  const { reference, plan, duration = 'monthly' } = data;

  try {
    // 3. Verifier si ce paiement n'est pas deja traite
    const existingPayment = await db.collection(COLLECTIONS.PAYMENTS)
      .where('paystackRef', '==', reference)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingPayment.empty) {
      const existing = existingPayment.docs[0].data();
      if (existing.status === 'success') {
        await logPayment('payment_alreadyProcessed', userId, { reference });
        return { success: true, alreadyProcessed: true, paymentId: existingPayment.docs[0].id };
      }
    }

    // 4. Verifier aupres de Paystack (source de verite)
    let paystackData;
    try {
      const verifyResult = await verifyPaystackTransaction(reference);
      if (!verifyResult.status || verifyResult.data?.status !== 'success') {
        await logPayment('payment_paystackFailed', userId, { reference, response: verifyResult });
        throw new Error('Transaction Paystack non valide');
      }
      paystackData = verifyResult.data;
    } catch (paystackErr) {
      await logPayment('payment_paystackError', userId, { reference, error: paystackErr.message });
      throw new Error(`Erreur Paystack: ${paystackErr.message}`);
    }

    // 5. Verifier que le montant correspond au plan
    const planPrices = { standard: 5000, professional: 10000, enterprise: 25000 };
    const expectedAmount = planPrices[plan] || 0;
    const receivedAmount = paystackData.amount / 100; // Paystack envoie en centimes

    if (receivedAmount < expectedAmount) {
      await logSecurity('payment_amountMismatch', userId, {
        reference, expected: expectedAmount, received: receivedAmount, plan
      });
      throw new Error('Montant du paiement incorrect');
    }

    // 6. Executer toutes les ecritures dans une transaction
    const now = new Date().toISOString();
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const subscriptionId = `sub_${userId}_${plan}_${Date.now()}`;
    const invoiceId = `inv_${paymentId}`;

    await db.runTransaction(async (t) => {
      // 6a. Enregistrer le paiement
      const paymentRef = db.collection(COLLECTIONS.PAYMENTS).doc(paymentId);
      t.set(paymentRef, {
        userId,
        subscriptionId,
        plan,
        amount: expectedAmount,
        currency: 'XOF',
        status: 'success',
        method: paystackData.channel || 'card',
        paystackRef: reference,
        paystackTransactionId: String(paystackData.id),
        authorizationCode: paystackData.authorization?.authorization_code || '',
        paidAt: now,
        metadata: { gateway_response: paystackData.gateway_response },
        createdAt: now,
        updatedAt: now
      });

      // 6b. Desactiver l'ancien abonnement
      const oldSubs = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
        .where('userId', '==', userId)
        .where('status', 'in', ['active', 'trial'])
        .get();
      oldSubs.docs.forEach(doc => {
        t.update(doc.ref, { status: 'cancelled', updatedAt: now });
      });

      // 6c. Creer le nouvel abonnement
      const endDate = new Date();
      if (duration === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
      else endDate.setMonth(endDate.getMonth() + 1);

      const subRef = db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscriptionId);
      t.set(subRef, {
        userId,
        plan,
        status: 'active',
        price: expectedAmount,
        currency: 'XOF',
        duration,
        startDate: now,
        endDate: endDate.toISOString(),
        autoRenew: true,
        paymentMethod: paystackData.channel || 'card',
        lastPaymentAt: now,
        nextPaymentAt: endDate.toISOString(),
        features: getPlanFeatures(plan),
        createdAt: now,
        updatedAt: now
      });

      // 6d. Creer la transaction
      const txnRef = db.collection(COLLECTIONS.TRANSACTIONS).doc(`txn_${paymentId}`);
      t.set(txnRef, {
        userId,
        paymentId,
        subscriptionId,
        type: 'payment',
        status: 'completed',
        amount: expectedAmount,
        currency: 'XOF',
        plan,
        description: `Paiement — Plan ${plan}`,
        paystackRef: reference,
        createdAt: now
      });

      // 6e. Generer la facture
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      const invoiceRef = db.collection(COLLECTIONS.INVOICES).doc(invoiceId);
      t.set(invoiceRef, {
        invoiceNumber: `FA-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${Math.random().toString(36).substr(2,6).toUpperCase()}`,
        userId,
        userName: userData.displayName || '',
        userEmail: userData.email || '',
        paymentId,
        subscriptionId,
        plan,
        planName: plan.charAt(0).toUpperCase() + plan.slice(1),
        status: 'paid',
        items: [{ description: `Abonnement ${plan}`, quantity: 1, unitPrice: expectedAmount, total: expectedAmount }],
        subtotal: expectedAmount,
        taxRate: 0,
        taxAmount: 0,
        total: expectedAmount,
        currency: 'XOF',
        notes: 'Merci pour votre confiance !',
        paidAt: now,
        createdAt: now,
        updatedAt: now
      });

      // 6f. Mettre a jour le profil utilisateur
      const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
      t.update(userRef, { subscriptionPlan: plan, updatedAt: now });
    });

    await logPayment('payment_success', userId, { reference, plan, amount: expectedAmount, paymentId });

    return {
      success: true,
      paymentId,
      subscriptionId,
      invoiceId,
      plan,
      amount: expectedAmount
    };

  } catch (err) {
    await logError('payment_validation', userId, err, 'critical');
    throw new Error(err.message || 'Validation echouee');
  }
}

function getPlanFeatures(plan) {
  const features = {
    free: ['1 cours gratuit', '30 min IA Tutor/mois', '5 quiz/mois'],
    standard: ['3 cours', '2h IA Tutor/mois', '20 quiz/mois', 'Certificats'],
    professional: ['10 cours', '10h IA Tutor/mois', 'Quiz illimites', 'Certificats premium'],
    enterprise: ['Cours illimites', 'IA Tutor illimite', 'Examens DELF/DALF/TCF', 'Coaching']
  };
  return features[plan] || features.free;
}

module.exports = { processPaymentValidation, verifyPaystackTransaction };
