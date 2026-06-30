/**
 * AuthView.js
 * View pour l'authentification : Login, Register, Forgot Password, Verification, Profile.
 *
 * Événements capturés → transmis au AuthController.
 */

import { BaseView } from './BaseView.js';

/**
 * @class AuthView
 * @extends BaseView
 * Gère l'affichage de toutes les interfaces d'authentification.
 */
export class AuthView extends BaseView {
  constructor(options = {}) {
    super({
      viewName: 'AuthView',
      ...options
    });

    this.currentScreen = 'login'; // 'login' | 'register' | 'forgot' | 'verify' | 'profile'
    this.formData = {};
  }

  // ============================================================
  // Rendu principal
  // ============================================================

  /**
   * Rend l'écran d'authentification courant.
   * @returns {HTMLElement}
   */
  render() {
    this.clear();

    const wrapper = this.createElement('div', {
      classNames: ['auth-view'],
      attributes: { 'data-auth-screen': this.currentScreen }
    });

    switch (this.currentScreen) {
      case 'login':
        wrapper.appendChild(this._renderLogin());
        break;
      case 'register':
        wrapper.appendChild(this._renderRegister());
        break;
      case 'forgot':
        wrapper.appendChild(this._renderForgotPassword());
        break;
      case 'verify':
        wrapper.appendChild(this._renderVerification());
        break;
      case 'profile':
        wrapper.appendChild(this._renderProfile());
        break;
      default:
        wrapper.appendChild(this._renderLogin());
    }

    this.container.appendChild(wrapper);
    return this.container;
  }

  // ============================================================
  // Écran: Login
  // ============================================================

  /**
   * Rend le formulaire de connexion.
   * @returns {HTMLElement}
   * @private
   */
  _renderLogin() {
    const section = this.createElement('section', {
      classNames: ['auth-screen', 'auth-screen--login'],
      attributes: { 'aria-labelledby': 'login-title' }
    });

    section.innerHTML = `
      <div class="auth-card">
        <header class="auth-card__header">
          <h1 id="login-title" class="auth-card__title">Connexion</h1>
          <p class="auth-card__subtitle">Bienvenue sur Francophone Academy</p>
        </header>

        <form class="auth-form" id="login-form" novalidate>
          <div class="form-group">
            <label for="login-email" class="form-label">Adresse email</label>
            <input 
              type="email" 
              id="login-email" 
              name="email" 
              class="form-input" 
              placeholder="votre@email.com" 
              required 
              autocomplete="email"
              aria-describedby="login-email-error"
            />
            <span id="login-email-error" class="form-error" role="alert" aria-live="polite"></span>
          </div>

          <div class="form-group">
            <label for="login-password" class="form-label">Mot de passe</label>
            <div class="form-input-wrapper">
              <input 
                type="password" 
                id="login-password" 
                name="password" 
                class="form-input" 
                placeholder="Votre mot de passe" 
                required 
                autocomplete="current-password"
                aria-describedby="login-password-error"
              />
              <button type="button" class="btn-toggle-password" aria-label="Afficher le mot de passe">
                <span class="icon-eye" aria-hidden="true">👁</span>
              </button>
            </div>
            <span id="login-password-error" class="form-error" role="alert" aria-live="polite"></span>
          </div>

          <div class="form-options">
            <label class="form-checkbox">
              <input type="checkbox" id="login-remember" name="remember" />
              <span>Se souvenir de moi</span>
            </label>
            <button type="button" class="btn btn--link" data-navigate="forgot">Mot de passe oublié ?</button>
          </div>

          <button type="submit" class="btn btn--primary btn--block" id="login-submit">
            <span class="btn-text">Se connecter</span>
            <span class="btn-loader" aria-hidden="true"></span>
          </button>

          <div class="auth-separator">
            <span class="auth-separator__text">ou</span>
          </div>

          <button type="button" class="btn btn--google btn--block" data-provider="google">
            <span class="btn-icon" aria-hidden="true">🔍</span>
            <span>Continuer avec Google</span>
          </button>

          <p class="auth-footer">
            Pas encore de compte ? 
            <button type="button" class="btn btn--link" data-navigate="register">S'inscrire</button>
          </p>
        </form>
      </div>
    `;

    return section;
  }

  // ============================================================
  // Écran: Register
  // ============================================================

  /**
   * Rend le formulaire d'inscription.
   * @returns {HTMLElement}
   * @private
   */
  _renderRegister() {
    const section = this.createElement('section', {
      classNames: ['auth-screen', 'auth-screen--register'],
      attributes: { 'aria-labelledby': 'register-title' }
    });

    section.innerHTML = `
      <div class="auth-card">
        <header class="auth-card__header">
          <h1 id="register-title" class="auth-card__title">Créer un compte</h1>
          <p class="auth-card__subtitle">Rejoignez Francophone Academy</p>
        </header>

        <form class="auth-form" id="register-form" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label for="register-firstname" class="form-label">Prénom</label>
              <input 
                type="text" 
                id="register-firstname" 
                name="firstName" 
                class="form-input" 
                placeholder="Jean" 
                required 
                autocomplete="given-name"
              />
              <span class="form-error" role="alert"></span>
            </div>
            <div class="form-group">
              <label for="register-lastname" class="form-label">Nom</label>
              <input 
                type="text" 
                id="register-lastname" 
                name="lastName" 
                class="form-input" 
                placeholder="Dupont" 
                required 
                autocomplete="family-name"
              />
              <span class="form-error" role="alert"></span>
            </div>
          </div>

          <div class="form-group">
            <label for="register-email" class="form-label">Adresse email</label>
            <input 
              type="email" 
              id="register-email" 
              name="email" 
              class="form-input" 
              placeholder="votre@email.com" 
              required 
              autocomplete="email"
            />
            <span class="form-error" role="alert"></span>
          </div>

          <div class="form-group">
            <label for="register-role" class="form-label">Vous êtes</label>
            <select id="register-role" name="role" class="form-select" required>
              <option value="">Sélectionnez...</option>
              <option value="student">Étudiant</option>
              <option value="teacher">Enseignant</option>
            </select>
            <span class="form-error" role="alert"></span>
          </div>

          <div class="form-group">
            <label for="register-password" class="form-label">Mot de passe</label>
            <input 
              type="password" 
              id="register-password" 
              name="password" 
              class="form-input" 
              placeholder="8 caractères minimum" 
              required 
              minlength="8"
              autocomplete="new-password"
              aria-describedby="password-hint"
            />
            <p id="password-hint" class="form-hint">Au moins 8 caractères, une majuscule, un chiffre</p>
            <div class="password-strength" aria-hidden="true">
              <div class="password-strength__bar"></div>
              <span class="password-strength__label"></span>
            </div>
            <span class="form-error" role="alert"></span>
          </div>

          <div class="form-group">
            <label for="register-password-confirm" class="form-label">Confirmer le mot de passe</label>
            <input 
              type="password" 
              id="register-password-confirm" 
              name="passwordConfirm" 
              class="form-input" 
              placeholder="Confirmez votre mot de passe" 
              required 
              autocomplete="new-password"
            />
            <span class="form-error" role="alert"></span>
          </div>

          <label class="form-checkbox">
            <input type="checkbox" id="register-terms" name="terms" required />
            <span>J'accepte les <a href="#" data-navigate="terms">conditions d'utilisation</a> et la <a href="#" data-navigate="privacy">politique de confidentialité</a></span>
          </label>

          <button type="submit" class="btn btn--primary btn--block" id="register-submit">
            <span class="btn-text">Créer mon compte</span>
            <span class="btn-loader" aria-hidden="true"></span>
          </button>

          <p class="auth-footer">
            Déjà un compte ? 
            <button type="button" class="btn btn--link" data-navigate="login">Se connecter</button>
          </p>
        </form>
      </div>
    `;

    return section;
  }

  // ============================================================
  // Écran: Forgot Password
  // ============================================================

  /**
   * Rend le formulaire de récupération de mot de passe.
   * @returns {HTMLElement}
   * @private
   */
  _renderForgotPassword() {
    const section = this.createElement('section', {
      classNames: ['auth-screen', 'auth-screen--forgot'],
      attributes: { 'aria-labelledby': 'forgot-title' }
    });

    section.innerHTML = `
      <div class="auth-card">
        <header class="auth-card__header">
          <h1 id="forgot-title" class="auth-card__title">Mot de passe oublié</h1>
          <p class="auth-card__subtitle">Entrez votre email pour recevoir un lien de réinitialisation</p>
        </header>

        <form class="auth-form" id="forgot-form" novalidate>
          <div class="form-group">
            <label for="forgot-email" class="form-label">Adresse email</label>
            <input 
              type="email" 
              id="forgot-email" 
              name="email" 
              class="form-input" 
              placeholder="votre@email.com" 
              required 
              autocomplete="email"
            />
            <span class="form-error" role="alert"></span>
          </div>

          <button type="submit" class="btn btn--primary btn--block" id="forgot-submit">
            <span class="btn-text">Envoyer le lien</span>
            <span class="btn-loader" aria-hidden="true"></span>
          </button>

          <button type="button" class="btn btn--text btn--block" data-navigate="login">
            ← Retour à la connexion
          </button>
        </form>
      </div>
    `;

    return section;
  }

  // ============================================================
  // Écran: Verification
  // ============================================================

  /**
   * Rend l'écran de vérification d'email.
   * @param {Object} data - Données de vérification
   * @returns {HTMLElement}
   * @private
   */
  _renderVerification(data = {}) {
    const section = this.createElement('section', {
      classNames: ['auth-screen', 'auth-screen--verify'],
      attributes: { 'aria-labelledby': 'verify-title' }
    });

    section.innerHTML = `
      <div class="auth-card auth-card--verify">
        <header class="auth-card__header">
          <div class="verify-icon" aria-hidden="true">📧</div>
          <h1 id="verify-title" class="auth-card__title">Vérifiez votre email</h1>
          <p class="auth-card__subtitle">
            Un lien de vérification a été envoyé à <strong>${data.email || 'votre adresse email'}</strong>
          </p>
        </header>

        <div class="verify-instructions">
          <p>Cliquez sur le lien dans l'email pour activer votre compte.</p>
          <p>Si vous ne trouvez pas l'email, vérifiez votre dossier spam.</p>
        </div>

        <button type="button" class="btn btn--primary btn--block" id="resend-verification" ${data.canResend === false ? 'disabled' : ''}>
          <span class="btn-text">Renvoyer l'email</span>
          <span class="btn-loader" aria-hidden="true"></span>
        </button>

        <p class="verify-timer" id="verify-timer"></p>

        <button type="button" class="btn btn--text btn--block" data-navigate="login">
          ← Retour à la connexion
        </button>
      </div>
    `;

    return section;
  }

  // ============================================================
  // Écran: Profile
  // ============================================================

  /**
   * Rend la page de profil utilisateur.
   * @param {Object} user - Données utilisateur
   * @returns {HTMLElement}
   * @private
   */
  _renderProfile(user = {}) {
    const section = this.createElement('section', {
      classNames: ['auth-screen', 'auth-screen--profile'],
      attributes: { 'aria-labelledby': 'profile-title' }
    });

    section.innerHTML = `
      <div class="profile-layout">
        <aside class="profile-sidebar">
          <div class="profile-avatar">
            <img src="${user.photoURL || '/assets/default-avatar.svg'}" alt="Photo de profil" class="profile-avatar__img" />
            <button class="btn btn--icon btn--change-avatar" data-action="change-avatar" aria-label="Changer la photo de profil">
              📷
            </button>
          </div>
          <h2 class="profile-name">${this._escapeHtml(user.displayName || 'Utilisateur')}</h2>
          <p class="profile-email">${this._escapeHtml(user.email || '')}</p>
          <span class="profile-role badge badge--${user.role || 'student'}">${this._getRoleLabel(user.role)}</span>
        </aside>

        <div class="profile-content">
          <h1 id="profile-title" class="profile-title">Mon profil</h1>

          <form class="profile-form" id="profile-form" novalidate>
            <div class="form-section">
              <h3 class="form-section__title">Informations personnelles</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="profile-firstname" class="form-label">Prénom</label>
                  <input type="text" id="profile-firstname" name="firstName" class="form-input" 
                    value="${this._escapeHtml(user.firstName || '')}" required />
                  <span class="form-error" role="alert"></span>
                </div>
                <div class="form-group">
                  <label for="profile-lastname" class="form-label">Nom</label>
                  <input type="text" id="profile-lastname" name="lastName" class="form-input" 
                    value="${this._escapeHtml(user.lastName || '')}" required />
                  <span class="form-error" role="alert"></span>
                </div>
              </div>

              <div class="form-group">
                <label for="profile-displayname" class="form-label">Nom d'affichage</label>
                <input type="text" id="profile-displayname" name="displayName" class="form-input" 
                  value="${this._escapeHtml(user.displayName || '')}" />
              </div>

              <div class="form-group">
                <label for="profile-phone" class="form-label">Téléphone</label>
                <input type="tel" id="profile-phone" name="phone" class="form-input" 
                  value="${this._escapeHtml(user.phone || '')}" autocomplete="tel" />
              </div>
            </div>

            <div class="form-section">
              <h3 class="form-section__title">Préférences d'apprentissage</h3>
              
              <div class="form-group">
                <label for="profile-level" class="form-label">Niveau actuel</label>
                <select id="profile-level" name="currentLevel" class="form-select">
                  <option value="A1" ${user.currentLevel === 'A1' ? 'selected' : ''}>A1 - Débutant</option>
                  <option value="A2" ${user.currentLevel === 'A2' ? 'selected' : ''}>A2 - Élémentaire</option>
                  <option value="B1" ${user.currentLevel === 'B1' ? 'selected' : ''}>B1 - Intermédiaire</option>
                  <option value="B2" ${user.currentLevel === 'B2' ? 'selected' : ''}>B2 - Avancé</option>
                  <option value="C1" ${user.currentLevel === 'C1' ? 'selected' : ''}>C1 - Autonome</option>
                  <option value="C2" ${user.currentLevel === 'C2' ? 'selected' : ''}>C2 - Maîtrise</option>
                </select>
              </div>

              <div class="form-group">
                <label for="profile-objective" class="form-label">Objectif d'apprentissage</label>
                <textarea id="profile-objective" name="learningObjective" class="form-textarea" rows="3"
                  placeholder="Décrivez votre objectif d'apprentissage du français...">${this._escapeHtml(user.learningObjective || '')}</textarea>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn--primary" id="profile-save">
                <span class="btn-text">Enregistrer les modifications</span>
                <span class="btn-loader" aria-hidden="true"></span>
              </button>
            </div>
          </form>

          <div class="profile-danger-zone">
            <h3 class="danger-zone__title">Zone de danger</h3>
            <button type="button" class="btn btn--danger btn--outline" data-action="delete-account">
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>
    `;

    return section;
  }

  // ============================================================
  // Navigation entre écrans
  // ============================================================

  /**
   * Change d'écran d'authentification.
   * @param {string} screen - Nom de l'écran cible
   * @param {Object} [data] - Données optionnelles
   */
  navigateTo(screen, data = {}) {
    this.currentScreen = screen;
    this.formData = { ...this.formData, ...data };
    this.render();
    this._bindEvents();
  }

  // ============================================================
  // Mise à jour de l'UI
  // ============================================================

  /**
   * Affiche un état de chargement sur un bouton de soumission.
   * @param {string} buttonId - ID du bouton
   * @param {boolean} loading - État de chargement
   */
  setSubmitLoading(buttonId, loading) {
    const button = this.query(`#${buttonId}`);
    if (!button) return;

    button.disabled = loading;
    button.classList.toggle('btn--loading', loading);
  }

  /**
   * Affiche une erreur de formulaire.
   * @param {string} fieldName - Nom du champ
   * @param {string} message - Message d'erreur
   */
  setFieldError(fieldName, message) {
    const field = this.query(`[name="${fieldName}"]`);
    if (!field) return;

    field.classList.add('form-input--error');
    field.setAttribute('aria-invalid', 'true');

    const errorEl = field.closest('.form-group')?.querySelector('.form-error');
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  /**
   * Efface toutes les erreurs du formulaire.
   */
  clearAllErrors() {
    this.queryAll('.form-input--error').forEach(input => {
      input.classList.remove('form-input--error');
      input.removeAttribute('aria-invalid');
    });
    this.queryAll('.form-error').forEach(el => {
      el.textContent = '';
    });
  }

  /**
   * Met à jour l'indicateur de force du mot de passe.
   * @param {number} strength - Force de 0 à 4
   */
  updatePasswordStrength(strength) {
    const bar = this.query('.password-strength__bar');
    const label = this.query('.password-strength__label');
    if (!bar || !label) return;

    const levels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    const colors = ['#e74c3c', '#e67e22', '#f39c12', '#27ae60', '#2ecc71'];

    bar.style.width = `${(strength + 1) * 20}%`;
    bar.style.backgroundColor = colors[strength] || colors[0];
    label.textContent = levels[strength] || levels[0];
    label.style.color = colors[strength] || colors[0];
  }

  /**
   * Met à jour le timer de renvoi de vérification.
   * @param {number} seconds - Secondes restantes
   */
  updateResendTimer(seconds) {
    const timerEl = this.query('#verify-timer');
    const btn = this.query('#resend-verification');

    if (!timerEl || !btn) return;

    if (seconds > 0) {
      btn.disabled = true;
      timerEl.textContent = `Vous pourrez renvoyer dans ${seconds}s`;
    } else {
      btn.disabled = false;
      timerEl.textContent = '';
    }
  }

  /**
   * Met à jour l'affichage du profil utilisateur.
   * @param {Object} user - Données utilisateur
   */
  updateProfile(user) {
    const nameEl = this.query('.profile-name');
    const emailEl = this.query('.profile-email');
    const avatarEl = this.query('.profile-avatar__img');

    if (nameEl) nameEl.textContent = this._escapeHtml(user.displayName || 'Utilisateur');
    if (emailEl) emailEl.textContent = this._escapeHtml(user.email || '');
    if (avatarEl) avatarEl.src = user.photoURL || '/assets/default-avatar.svg';
  }

  // ============================================================
  // Événements
  // ============================================================

  _bindEvents() {
    // Navigation entre écrans
    this.queryAll('[data-navigate]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        e.preventDefault();
        const target = e.currentTarget.dataset.navigate;
        this.navigateTo(target);
      });
    });

    // Soumission des formulaires
    const loginForm = this.query('#login-form');
    if (loginForm) {
      this.bind(loginForm, 'submit', this._onLoginSubmit);
    }

    const registerForm = this.query('#register-form');
    if (registerForm) {
      this.bind(registerForm, 'submit', this._onRegisterSubmit);
    }

    const forgotForm = this.query('#forgot-form');
    if (forgotForm) {
      this.bind(forgotForm, 'submit', this._onForgotSubmit);
    }

    const profileForm = this.query('#profile-form');
    if (profileForm) {
      this.bind(profileForm, 'submit', this._onProfileSubmit);
    }

    // Toggle mot de passe
    this.queryAll('.btn-toggle-password').forEach(btn => {
      this.bind(btn, 'click', this._onTogglePassword);
    });

    // Auth sociale
    this.queryAll('[data-provider]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const provider = e.currentTarget.dataset.provider;
        this.controller?.onSocialAuth?.(provider);
      });
    });

    // Renvoi de vérification
    const resendBtn = this.query('#resend-verification');
    if (resendBtn) {
      this.bind(resendBtn, 'click', () => {
        this.controller?.onResendVerification?.();
      });
    }

    // Changement d'avatar
    const changeAvatarBtn = this.query('[data-action="change-avatar"]');
    if (changeAvatarBtn) {
      this.bind(changeAvatarBtn, 'click', () => {
        this.controller?.onChangeAvatar?.();
      });
    }

    // Suppression de compte
    const deleteBtn = this.query('[data-action="delete-account"]');
    if (deleteBtn) {
      this.bind(deleteBtn, 'click', this._onDeleteAccount);
    }

    // Force du mot de passe
    const passwordInput = this.query('#register-password');
    if (passwordInput) {
      this.bind(passwordInput, 'input', (e) => {
        this.controller?.onPasswordChange?.(e.target.value);
      });
    }
  }

  // ============================================================
  // Handlers d'événements (transmettent au Controller)
  // ============================================================

  _onLoginSubmit(e) {
    e.preventDefault();
    this.clearAllErrors();

    const formData = new FormData(e.target);
    const data = {
      email: formData.get('email')?.trim(),
      password: formData.get('password'),
      remember: formData.get('remember') === 'on'
    };

    this.controller?.onLogin?.(data);
  }

  _onRegisterSubmit(e) {
    e.preventDefault();
    this.clearAllErrors();

    const formData = new FormData(e.target);
    const data = {
      firstName: formData.get('firstName')?.trim(),
      lastName: formData.get('lastName')?.trim(),
      email: formData.get('email')?.trim(),
      role: formData.get('role'),
      password: formData.get('password'),
      passwordConfirm: formData.get('passwordConfirm'),
      terms: formData.get('terms') === 'on'
    };

    if (this.controller?.onRegister) {
      this.controller.onRegister(data);
    } else {
      console.error('[AuthView] Controller non disponible pour l\'inscription.');
    }
  }

  _onForgotSubmit(e) {
    e.preventDefault();
    this.clearAllErrors();

    const formData = new FormData(e.target);
    const email = formData.get('email')?.trim();

    this.controller?.onForgotPassword?.(email);
  }

  _onProfileSubmit(e) {
    e.preventDefault();
    this.clearAllErrors();

    const formData = new FormData(e.target);
    const data = {
      firstName: formData.get('firstName')?.trim(),
      lastName: formData.get('lastName')?.trim(),
      displayName: formData.get('displayName')?.trim(),
      phone: formData.get('phone')?.trim(),
      currentLevel: formData.get('currentLevel'),
      learningObjective: formData.get('learningObjective')?.trim()
    };

    this.controller?.onUpdateProfile?.(data);
  }

  _onTogglePassword(e) {
    const btn = e.currentTarget;
    const input = btn.closest('.form-input-wrapper')?.querySelector('input');
    if (!input) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.setAttribute('aria-label', isPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    btn.querySelector('.icon-eye').textContent = isPassword ? '🙈' : '👁';
  }

  showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add('toast--hide');
      window.setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  _onDeleteAccount() {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.');
    if (confirmed) {
      this.controller?.onDeleteAccount?.();
    }
  }

  // ============================================================
  // Utilitaires
  // ============================================================

  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _getRoleLabel(role) {
    const labels = {
      student: 'Étudiant',
      teacher: 'Enseignant',
      admin: 'Administrateur'
    };
    return labels[role] || 'Étudiant';
  }
}
