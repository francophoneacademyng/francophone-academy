/**
 * login.js — Page Login
 * Instancie AuthView + AuthController avec Firebase reel.
 * Architecture : HTML -> View -> Controller -> AIService -> Service -> Repository -> Firestore
 */

import { AuthView } from '../../src/views/AuthView.js';
import { AuthController } from '../../src/controllers/AuthController.js';

// Verifier si deja connecte (Auth Guard)
if (AuthController.isAuthenticated()) {
  window.location.href = '../dashboard/dashboard.html';
}

// Container DOM
const container = document.getElementById('auth-container');

// Controller avec services reels Firebase
const controller = new AuthController();

// View avec injection de dependances
const view = new AuthView({
  viewName: 'LoginPage',
  container: container,
  controller: controller
});

// Connecter controller -> view
controller.setView(view);
controller.init(); // Ecoute l'etat d'authentification Firebase

// Initialiser sur l'ecran login
view.navigateTo('login');

// Delegation d'evenements pour la navigation inter-pages
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-navigate]');
  if (!target) return;

  e.preventDefault();
  const navigateTo = target.dataset.navigate;

  switch (navigateTo) {
    case 'register':
      window.location.href = '../register/register.html';
      break;
    case 'forgot':
      view.navigateTo('forgot');
      break;
    case 'login':
      view.navigateTo('login');
      break;
  }
});
