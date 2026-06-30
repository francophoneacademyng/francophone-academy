/**
 * pricing.js — Page Tarifs & Abonnements
 * Architecture : HTML -> View -> Controller -> AIService -> Service -> Repository -> Firestore
 */

import { AuthController } from '../../src/controllers/AuthController.js';
import { PaymentController } from '../../src/controllers/PaymentController.js';

// Auth guard
if (!AuthController.isAuthenticated()) {
  window.location.href = '../login/login.html';
}

const controller = new PaymentController();
const container = document.getElementById('pricing-container');
const currentSubContainer = document.getElementById('current-subscription');
const historySection = document.getElementById('pricing-history');
const paymentsList = document.getElementById('payments-list');
const user = AuthController.getCurrentUser();

if (user?.displayName) {
  document.getElementById('user-name').textContent = user.displayName;
}

// State
let state = { duration: 'monthly', plans: [], currentPlan: null, subscription: null };

// ============================================
// VIEW
// ============================================
const view = {
  showToast: (message, type = 'info', duration = 3000) => {
    const tc = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    tc.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => { toast.classList.remove('toast--visible'); setTimeout(() => toast.remove(), 300); }, duration);
  },

  renderLoading: (msg) => {
    container.innerHTML = `<div class="loading-state" style="padding:var(--space-8)"><div class="loading-spinner"></div><p>${msg}</p></div>`;
  },

  // ========== PLANS ==========
  renderPlans: (plans, currentPlanKey) => {
    state.plans = plans;
    const duration = state.duration;

    let html = '<div class="pricing-plans">';
    plans.forEach(plan => {
      const isPopular = plan.key === 'professional';
      const isCurrent = plan.key === currentPlanKey;
      const price = duration === 'yearly' ? Math.round(plan.price * 12 * 0.8) : plan.price;
      const period = duration === 'yearly' ? 'an' : 'mois';
      const allFeatures = [
        'Acces aux cours',
        'Quiz d\'evaluation',
        'Progression',
        'Certificats',
        'IA Tutor',
        'Support email',
        'Examens DELF/DALF',
        'Coaching personnalise'
      ];

      html += `
        <div class="pricing-plan ${isPopular ? 'pricing-plan--popular' : ''} ${isCurrent ? 'pricing-plan--current' : ''}">
          ${isPopular ? '<span class="pricing-plan__badge">Populaire</span>' : ''}
          ${isCurrent ? '<span class="pricing-plan__badge pricing-plan__badge--current">Actif</span>' : ''}
          <h3 class="pricing-plan__name">${plan.name}</h3>
          <p class="pricing-plan__desc">${plan.description || plan.features[0] || ''}</p>
          <div class="pricing-plan__price">
            <span class="pricing-plan__amount">${price === 0 ? 'Gratuit' : price.toLocaleString('fr-FR')}</span>
            ${price > 0 ? `<span class="pricing-plan__currency">${plan.currency}</span>` : ''}
          </div>
          <p class="pricing-plan__period">${duration === 'yearly' ? 'par an' : 'par mois'}</p>
          <ul class="pricing-plan__features">`;

      plan.features.forEach(f => {
        html += `<li><span class="feature-icon">&#9989;</span> ${f}</li>`;
      });

      html += `</ul>`;

      if (isCurrent) {
        html += `<button class="btn btn--outline pricing-plan__btn pricing-plan__btn--current" disabled>&#9989; Plan actuel</button>`;
      } else {
        html += `<button class="btn btn--primary pricing-plan__btn" data-action="subscribe" data-plan="${plan.key}">
          ${price === 0 ? 'Commencer gratuitement' : 'Souscrire'}
        </button>`;
      }

      html += `</div>`;
    });
    html += '</div>';
    container.innerHTML = html;

    // Bind
    container.querySelectorAll('[data-action="subscribe"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const planKey = e.currentTarget.dataset.plan;
        onSubscribe(planKey);
      });
    });
  },

  // ========== CURRENT SUBSCRIPTION ==========
  renderCurrentSubscription: (stats) => {
    if (!stats || stats.plan === 'free' && !stats.endDate) {
      currentSubContainer.innerHTML = '';
      return;
    }

    const daysText = stats.daysRemaining > 0
      ? `${stats.daysRemaining} jours restants`
      : stats.daysRemaining === -1 ? 'Illimite' : 'Expire';

    currentSubContainer.innerHTML = `
      <div class="current-sub__card">
        <div class="current-sub__header">
          <span class="current-sub__title">&#127775; Votre abonnement : ${stats.planName}</span>
          <span class="current-sub__status current-sub__status--${stats.isActive ? 'active' : 'expired'}">${stats.isActive ? 'Actif' : 'Inactif'}</span>
        </div>
        <div class="current-sub__grid">
          <div class="current-sub__item">
            <span class="current-sub__value">${stats.planName}</span>
            <span class="current-sub__label">Plan</span>
          </div>
          <div class="current-sub__item">
            <span class="current-sub__value">${daysText}</span>
            <span class="current-sub__label">Validite</span>
          </div>
          <div class="current-sub__item">
            <span class="current-sub__value">${stats.totalPaid.toLocaleString('fr-FR')} ${stats.currency}</span>
            <span class="current-sub__label">Total paye</span>
          </div>
          <div class="current-sub__item">
            <span class="current-sub__value">${stats.paymentCount}</span>
            <span class="current-sub__label">Paiements</span>
          </div>
        </div>
        ${stats.autoRenew ? '<p style="font-size:0.75rem;color:var(--text-muted);margin-top:var(--space-3)">&#9851; Renouvellement automatique active</p>' : ''}
      </div>`;
  },

  // ========== PAYMENT HISTORY ==========
  renderPaymentHistory: (payments) => {
    if (!payments || payments.length === 0) {
      historySection.style.display = 'none';
      return;
    }
    historySection.style.display = 'block';
    paymentsList.innerHTML = payments.map(p => `
      <div class="payment-row">
        <div class="payment-row__info">
          <span class="payment-row__plan">Abonnement ${p.plan} — ${p.amount.toLocaleString('fr-FR')} ${p.currency}</span>
          <span class="payment-row__date">${p.date ? new Date(p.date).toLocaleDateString('fr-FR') : ''} — Ref: ${p.reference}</span>
        </div>
        <span class="payment-row__status payment-row__status--${p.status}">${p.status === 'success' ? 'Paye' : p.status}</span>
      </div>
    `).join('');
  },

  // ========== CALLBACKS ==========
  onPaymentSuccess: (subscription, payment, invoice) => {
    view.showToast('Paiement reussi ! Votre abonnement est actif.', 'success');
    setTimeout(() => refreshAll(), 1000);
  },

  onPaymentFailed: (error) => {
    view.showToast(error || 'Paiement echoue', 'error');
  },

  onPaymentCancelled: () => {
    view.showToast('Paiement annule', 'info');
  },

  onSubscriptionCancelled: () => {
    refreshAll();
  }
};

controller.setView(view);

// ============================================
// EVENTS
// ============================================
document.getElementById('btn-logout')?.addEventListener('click', () => AuthController.logout());

document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
  document.getElementById('pricing-sidebar').classList.toggle('pricing-sidebar--open');
});

// Toggle monthly/yearly
document.getElementById('toggle-monthly')?.addEventListener('click', (e) => {
  state.duration = 'monthly';
  document.getElementById('toggle-monthly').classList.add('pricing-toggle__btn--active');
  document.getElementById('toggle-yearly').classList.remove('pricing-toggle__btn--active');
  refreshAll();
});

document.getElementById('toggle-yearly')?.addEventListener('click', (e) => {
  state.duration = 'yearly';
  document.getElementById('toggle-yearly').classList.add('pricing-toggle__btn--active');
  document.getElementById('toggle-monthly').classList.remove('pricing-toggle__btn--active');
  refreshAll();
});

// ============================================
// ACTIONS
// ============================================
async function onSubscribe(planKey) {
  view.renderLoading('Traitement en cours...');
  await controller.onSelectPlan(planKey, state.duration);
}

// ============================================
// INIT
// ============================================
async function refreshAll() {
  view.renderLoading('Chargement...');

  const [plans, stats, payments] = await Promise.all([
    controller.loadPlans(),
    controller.loadSubscriptionStats(),
    controller.loadInvoices()
  ]);

  const currentPlanKey = stats?.plan || 'free';
  view.renderPlans(plans, currentPlanKey);
  view.renderCurrentSubscription(stats);

  // Also load payment history
  const history = await controller.loadAllPayments();
  view.renderPaymentHistory(history);
}

refreshAll();
