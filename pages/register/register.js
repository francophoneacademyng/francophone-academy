/**
 * register.js — Page Register
 * Instancie AuthView + AuthController avec Firebase reel.
 * Architecture : HTML -> View -> Controller -> AIService -> Service -> Repository -> Firestore
 */

import { AuthView } from '../../src/views/AuthView.js';
import { AuthController } from '../../src/controllers/AuthController.js';

// Auth Guard — redirige si deja connecte
if (AuthController.isAuthenticated()) {
  window.location.href = '../dashboard/dashboard.html';
}

// Container DOM
const container = document.getElementById('auth-container');

// Controller avec services reels Firebase
const controller = new AuthController();

// View
const view = new AuthView({
  viewName: 'RegisterPage',
  container: container,
  controller: controller
});

controller.setView(view);
controller.init(); // Ecoute l'etat d'authentification Firebase

// Afficher l'ecran d'inscription
view.navigateTo('register');

// Navigation
document.addEventListener('click', (e) => {
  const loginLink = e.target.closest('[data-navigate="login"]');
  if (loginLink) {
    e.preventDefault();
    window.location.href = '../login/login.html';
  }
});
