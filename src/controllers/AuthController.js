/**
 * AuthController.js
 * Controller d'authentification — connecte AuthView aux services reels via AIService.
 *
 * Architecture : View -> Controller -> AIService -> AuthService -> Firebase Auth + UserRepository
 */

import { aiService } from '../services/AIService.js';
import { translateFirebaseError } from '../utils/firebaseErrors.js';

/**
 * @class AuthController
 * Gere la logique d'authentification. Ne contient aucun acces direct a Firebase.
 */
export class AuthController {
  constructor() {
    this.view = null;
    this._unsubscribeAuth = null;
  }

  setView(view) {
    this.view = view;
  }

  // ============================================
  // INITIALISATION
  // ============================================

  /**
   * Initialise l'ecoute de l'etat d'authentification.
   * Appeler au chargement de la page.
   */
  init() {
    this._unsubscribeAuth = aiService.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // Sauvegarder la session
        this._persistSession(firebaseUser);
      }
    });
  }

  /**
   * Nettoie les ressources.
   */
  destroy() {
    if (this._unsubscribeAuth) {
      this._unsubscribeAuth();
    }
  }

  // ============================================
  // LOGIN
  // ============================================

  async onLogin(data) {
    // Validation cote client (View + Controller)
    const errors = this._validateLogin(data);
    if (Object.keys(errors).length > 0) {
      this.view.clearAllErrors();
      Object.entries(errors).forEach(([field, msg]) => this.view.setFieldError(field, msg));
      return;
    }

    this.view.setSubmitLoading('login-submit', true);

    const result = await aiService.login(data.email, data.password);

    this.view.setSubmitLoading('login-submit', false);

    if (result.error) {
      this.view.setFieldError('email', result.error);
      this.view.showToast(result.error, 'error', 5000);
      return;
    }

    // Sauvegarder la session
    this._persistSession(result.user);

    this.view.showToast('Connexion reussie ! Redirection...', 'success');
    setTimeout(() => {
      window.location.href = '../dashboard/dashboard.html';
    }, 800);
  }

  // ============================================
  // REGISTER
  // ============================================

  async onRegister(data) {
    const errors = this._validateRegister(data);
    if (Object.keys(errors).length > 0) {
      this.view.clearAllErrors();
      Object.entries(errors).forEach(([field, msg]) => this.view.setFieldError(field, msg));
      return;
    }

    this.view.setSubmitLoading('register-submit', true);

    try {
      const result = await aiService.register(data);

      this.view.setSubmitLoading('register-submit', false);

      if (result?.error) {
        const message = result.error;
        if (message.includes('e-mail') || message.includes('email')) {
          this.view.setFieldError('email', message);
        } else if (message.includes('mot de passe') || message.includes('password')) {
          this.view.setFieldError('password', message);
        } else {
          this.view.showToast(message, 'error', 5000);
        }
        return;
      }

      this._persistSession(result?.user);

      this.view.showToast('Compte cree avec succes ! Redirection...', 'success');
      setTimeout(() => {
        window.location.href = '../dashboard/dashboard.html';
      }, 800);
    } catch (error) {
      this.view.setSubmitLoading('register-submit', false);
      const message = error?.message || 'Une erreur inattendue est survenue lors de l\'inscription.';
      this.view.showToast(message, 'error', 5000);
      console.error('[AuthController.onRegister]', error);
    }
  }

  // ============================================
  // GOOGLE AUTH
  // ============================================

  async onSocialAuth(provider) {
    if (provider !== 'google') {
      this.view.showToast(`Le fournisseur "${provider}" n'est pas encore supporte.`, 'warning');
      return;
    }

    this.view.setSubmitLoading('login-submit', true);

    const result = await aiService.loginWithGoogle();

    this.view.setSubmitLoading('login-submit', false);

    if (result.error) {
      this.view.showToast(result.error, 'error', 5000);
      return;
    }

    this._persistSession(result.user);

    const message = result.isNewUser
      ? 'Compte cree avec Google ! Redirection...'
      : 'Connexion Google reussie ! Redirection...';

    this.view.showToast(message, 'success');
    setTimeout(() => {
      window.location.href = '../dashboard/dashboard.html';
    }, 800);
  }

  // ============================================
  // FORGOT PASSWORD
  // ============================================

  async onForgotPassword(email) {
    if (!email || !/^[^\s@]+@[^\s@\.]+\.[^\s@]+$/.test(email)) {
      this.view.setFieldError('email', 'Veuillez entrer un email valide.');
      return;
    }

    this.view.setSubmitLoading('forgot-submit', true);

    const result = await aiService.resetPassword(email);

    this.view.setSubmitLoading('forgot-submit', false);

    if (result.error) {
      this.view.setFieldError('email', result.error);
      this.view.showToast(result.error, 'error', 5000);
      return;
    }

    this.view.showToast('Email de reinitialisation envoye ! Verifiez votre boite de reception.', 'success', 6000);
  }

  // ============================================
  // PASSWORD STRENGTH
  // ============================================

  onPasswordChange(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    this.view.updatePasswordStrength(Math.min(strength, 4));
  }

  // ============================================
  // SESSION
  // ============================================

  _persistSession(user) {
    if (!user) return;
    const session = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      emailVerified: user.emailVerified || false,
      timestamp: Date.now()
    };
    sessionStorage.setItem('fa_user', JSON.stringify(session));
  }

  static getCurrentUser() {
    try {
      return JSON.parse(sessionStorage.getItem('fa_user'));
    } catch {
      return null;
    }
  }

  static isAuthenticated() {
    return !!sessionStorage.getItem('fa_user');
  }

  static async logout() {
    await aiService.logout();
    sessionStorage.removeItem('fa_user');
    window.location.href = '../login/login.html';
  }

  // ============================================
  // VALIDATION
  // ============================================

  _validateLogin(data) {
    const errors = {};
    if (!data.email?.trim()) errors.email = 'L\'email est requis.';
    else if (!/^[^\s@]+@[^\s@\.]+\.[^\s@]+$/.test(data.email)) errors.email = 'Format d\'email invalide.';

    if (!data.password) errors.password = 'Le mot de passe est requis.';
    else if (data.password.length < 6) errors.password = 'Le mot de passe doit contenir au moins 6 caracteres.';

    return errors;
  }

  _validateRegister(data) {
    const errors = {};
    if (!data.firstName?.trim()) errors.firstName = 'Le prenom est requis.';
    if (!data.lastName?.trim()) errors.lastName = 'Le nom est requis.';

    if (!data.email?.trim()) errors.email = 'L\'email est requis.';
    else if (!/^[^\s@]+@[^\s@\.]+\.[^\s@]+$/.test(data.email)) errors.email = 'Format d\'email invalide.';

    if (!data.role) errors.role = 'Veuillez selectionner votre profil.';

    if (!data.password) errors.password = 'Le mot de passe est requis.';
    else if (data.password.length < 8) errors.password = 'Le mot de passe doit contenir au moins 8 caracteres.';

    if (!data.passwordConfirm) errors.passwordConfirm = 'Veuillez confirmer votre mot de passe.';
    else if (data.password !== data.passwordConfirm) errors.passwordConfirm = 'Les mots de passe ne correspondent pas.';

    if (!data.terms) errors.terms = 'Vous devez accepter les conditions d\'utilisation.';

    return errors;
  }
}
