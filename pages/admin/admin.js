/**
 * admin.js
 * Point d'entree minimal pour l'espace d'administration.
 * Réutilise la vue admin existante sans introduire de nouveau produit.
 */

import { AuthController } from '../../src/controllers/AuthController.js';
import { aiService } from '../../src/services/AIService.js';
import { AdminView } from '../../src/views/AdminView.js';

const container = document.getElementById('admin-container');

function renderAccessDenied() {
  container.innerHTML = `
    <section style="padding: 3rem; text-align: center;">
      <h1 style="margin-bottom: 1rem;">Accès administrateur</h1>
      <p style="margin-bottom: 1.5rem; color: #64748b;">Cette zone est réservée aux administrateurs de Francophone Academy.</p>
      <a href="../dashboard/dashboard.html" class="btn btn--primary">Retour au tableau de bord</a>
    </section>
  `;
}

function renderLoginRequired() {
  window.location.href = '../login/login.html';
}

function createController() {
  const zeroStats = {
    totalUsers: 0,
    totalTeachers: 0,
    monthlyRevenue: '0 XOF',
    activeLessons: 0,
    quizzesTaken: 0,
    engagementRate: '0%',
    recentUsers: [],
    recentActivities: []
  };

  return {
    onViewSite() {
      window.location.href = '../dashboard/dashboard.html';
    },
    getAdminStats() {
      return zeroStats;
    },
    getUsers() {
      return { items: [], total: 0 };
    },
    getTeachers() {
      return [];
    },
    getContentItems() {
      return [];
    },
    getPayments() {
      return [];
    },
    getSubscriptionPlans() {
      return [];
    },
    onInviteUser() {},
    onViewUser() {},
    onEditUser() {},
    onSuspendUser() {},
    onAddTeacher() {},
    onViewTeacher() {},
    onEditTeacher() {},
    onRemoveTeacher() {},
    onCreateContent() {},
    onEditContent() {},
    onPreviewContent() {},
    onDeleteContent() {},
    onEditPlan() {},
    onTogglePlan() {},
    onViewPayment() {},
    onSaveSettings() {},
    onResetData() {}
  };
}

async function init() {
  if (!AuthController.isAuthenticated()) {
    renderLoginRequired();
    return;
  }

  const sessionUser = AuthController.getCurrentUser();
  if (!sessionUser?.uid) {
    renderLoginRequired();
    return;
  }

  container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #475569;">Vérification des droits administrateur...</div>';

  const profile = await aiService.getUserProfile(sessionUser.uid);
  const role = profile?.role || sessionUser?.role || '';

  if (role !== 'admin' && role !== 'superadmin') {
    renderAccessDenied();
    return;
  }

  container.innerHTML = '';

  const controller = createController();
  const view = new AdminView({
    container,
    controller,
    viewName: 'AdminView'
  });

  controller.view = view;
  view.mount();
}

init().catch((err) => {
  console.error('[admin.js]', err);
  container.innerHTML = `
    <section style="padding: 3rem; text-align: center;">
      <h1>Erreur de chargement</h1>
      <p style="color: #64748b;">L'espace administrateur n'a pas pu être chargé.</p>
      <button class="btn btn--primary" onclick="window.location.reload()">Réessayer</button>
    </section>
  `;
});