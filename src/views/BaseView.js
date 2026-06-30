/**
 * BaseView.js
 * Classe abstraite de base pour toutes les Views.
 * Fournit les utilitaires DOM et la gestion du cycle de vie.
 *
 * Architecture: HTML → View → Controller → AIService → Service → Repository → Firestore
 */

/**
 * @class BaseView
 * @abstract
 * Classe de base que toutes les Views doivent étendre.
 * Ne contient aucune logique métier — uniquement la gestion de l'interface.
 */
export class BaseView {
  /**
   * @param {Object} options - Options de configuration
   * @param {string} options.viewName - Nom identifiant de la view
   * @param {HTMLElement} options.container - Conteneur DOM principal
   * @param {Object} options.controller - Controller associé (injection de dépendances)
   * @param {Object} options.components - UI Components disponibles
   * @param {Object} options.theme - Système de thème
   */
  constructor(options = {}) {
    if (new.target === BaseView) {
      throw new Error('BaseView est une classe abstraite et ne peut pas être instanciée directement.');
    }

    this.viewName = options.viewName || this.constructor.name;
    this.container = options.container || document.getElementById('app');
    this.controller = options.controller || null;
    this.components = options.components || {};
    this.theme = options.theme || {};

    this._eventListeners = new Map();
    this._isMounted = false;
    this._childElements = new Set();
  }

  // ============================================================
  // Cycle de vie
  // ============================================================

  /**
   * Montre la view dans le DOM.
   * Appelle render() puis configure les événements.
   * @returns {HTMLElement} Le conteneur rendu
   */
  mount() {
    if (this._isMounted) {
      console.warn(`[${this.viewName}] Déjà montée.`);
      return this.container;
    }

    this.render();
    this._bindEvents();
    this._isMounted = true;

    this.container.setAttribute('data-view', this.viewName);
    this.container.classList.add('view-mounted');

    return this.container;
  }

  /**
   * Détruit la view et nettoie les ressources.
   */
  unmount() {
    if (!this._isMounted) return;

    this._unbindAllEvents();
    this.clear();

    this._childElements.clear();
    this.container.removeAttribute('data-view');
    this.container.classList.remove('view-mounted');

    this._isMounted = false;
  }

  /**
   * Indique si la view est actuellement montée.
   * @returns {boolean}
   */
  isMounted() {
    return this._isMounted;
  }

  // ============================================================
  // Rendu (à surcharger)
  // ============================================================

  /**
   * Rend le contenu HTML de la view.
   * Doit être surchargé par les classes enfants.
   * @abstract
   * @returns {HTMLElement}
   */
  render() {
    throw new Error(`[${this.viewName}] La méthode render() doit être implémentée.`);
  }

  /**
   * Met à jour une partie spécifique de la view.
   * @param {string} selector - Sélecteur CSS de l'élément à mettre à jour
   * @param {string|HTMLElement} content - Nouveau contenu
   */
  update(selector, content) {
    const element = this.query(selector);
    if (!element) {
      console.warn(`[${this.viewName}] Élément non trouvé pour mise à jour: ${selector}`);
      return;
    }

    if (content instanceof HTMLElement) {
      element.innerHTML = '';
      element.appendChild(content);
    } else {
      element.innerHTML = content;
    }
  }

  /**
   * Vide le conteneur principal.
   */
  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  // ============================================================
  // Sélection DOM
  // ============================================================

  /**
   * Sélectionne un élément dans le conteneur de la view.
   * @param {string} selector - Sélecteur CSS
   * @returns {HTMLElement|null}
   */
  query(selector) {
    if (!this.container) return null;
    return this.container.querySelector(selector);
  }

  /**
   * Sélectionne tous les éléments correspondants.
   * @param {string} selector - Sélecteur CSS
   * @returns {NodeList}
   */
  queryAll(selector) {
    if (!this.container) return new NodeList();
    return this.container.querySelectorAll(selector);
  }

  // ============================================================
  // Création d'éléments
  // ============================================================

  /**
   * Crée un élément DOM avec des attributs et du contenu.
   * @param {string} tag - Nom de la balise
   * @param {Object} options - Attributs et options
   * @param {string} [options.textContent] - Contenu texte
   * @param {string} [options.innerHTML] - Contenu HTML
   * @param {string[]} [options.classNames] - Classes CSS
   * @param {Object} [options.attributes] - Attributs HTML
   * @param {Object} [options.dataset] - Attributs data-*
   * @param {string} [options.id] - ID de l'élément
   * @returns {HTMLElement}
   */
  createElement(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.id) element.id = options.id;
    if (options.textContent) element.textContent = options.textContent;
    if (options.innerHTML) element.innerHTML = options.innerHTML;

    if (options.classNames) {
      element.classList.add(...options.classNames);
    }

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (options.dataset) {
      Object.entries(options.dataset).forEach(([key, value]) => {
        element.dataset[key] = value;
      });
    }

    this._childElements.add(element);
    return element;
  }

  // ============================================================
  // Gestion des événements
  // ============================================================

  /**
   * Attache un événement à un élément avec suivi automatique.
   * @param {string|HTMLElement} target - Sélecteur ou élément
   * @param {string} eventType - Type d'événement
   * @param {Function} handler - Gestionnaire
   * @param {Object} [options] - Options addEventListener
   */
  bind(target, eventType, handler, options = {}) {
    const element = typeof target === 'string' ? this.query(target) : target;
    if (!element) {
      console.warn(`[${this.viewName}] Impossible de binder: élément non trouvé ${target}`);
      return;
    }

    const boundHandler = handler.bind(this);
    element.addEventListener(eventType, boundHandler, options);

    const key = `${eventType}_${Math.random().toString(36).substr(2, 9)}`;
    this._eventListeners.set(key, { element, eventType, handler: boundHandler, options });

    return key;
  }

  /**
   * Supprime un événement suivi.
   * @param {string} key - Clé retournée par bind()
   */
  unbind(key) {
    const listener = this._eventListeners.get(key);
    if (listener) {
      listener.element.removeEventListener(listener.eventType, listener.handler, listener.options);
      this._eventListeners.delete(key);
    }
  }

  /**
   * Supprime tous les événements enregistrés.
   * @private
   */
  _unbindAllEvents() {
    this._eventListeners.forEach(({ element, eventType, handler, options }) => {
      element.removeEventListener(eventType, handler, options);
    });
    this._eventListeners.clear();
  }

  /**
   * Méthode à surcharger pour binder les événements spécifiques.
   * @protected
   */
  _bindEvents() {
    // À surcharger dans les classes enfants
  }

  // ============================================================
  // États de rendu
  // ============================================================

  /**
   * Rend un état de chargement.
   * @param {string} [message='Chargement...'] - Message à afficher
   * @param {string} [selector] - Sélecteur cible (par défaut: container)
   */
  renderLoading(message = 'Chargement...', selector = null) {
    const target = selector ? this.query(selector) : this.container;
    if (!target) return;

    const loader = this.createElement('div', {
      classNames: ['loading-state'],
      attributes: { role: 'status', 'aria-live': 'polite' },
      innerHTML: `
        <div class="loading-spinner" aria-hidden="true"></div>
        <p class="loading-message">${message}</p>
      `
    });

    if (selector) {
      target.innerHTML = '';
      target.appendChild(loader);
    } else {
      this.clear();
      this.container.appendChild(loader);
    }
  }

  /**
   * Rend un état d'erreur.
   * @param {string} message - Message d'erreur
   * @param {Function} [onRetry] - Callback pour réessayer
   * @param {string} [selector] - Sélecteur cible
   */
  renderError(message, onRetry = null, selector = null) {
    const target = selector ? this.query(selector) : this.container;
    if (!target) return;

    const errorId = `error-${Math.random().toString(36).substr(2, 9)}`;
    const errorEl = this.createElement('div', {
      id: errorId,
      classNames: ['error-state'],
      attributes: { role: 'alert', 'aria-live': 'assertive' },
      innerHTML: `
        <div class="error-icon" aria-hidden="true">⚠️</div>
        <p class="error-message">${message}</p>
        ${onRetry ? `<button class="btn btn--retry" data-action="retry">Réessayer</button>` : ''}
      `
    });

    if (selector) {
      target.innerHTML = '';
      target.appendChild(errorEl);
    } else {
      this.clear();
      this.container.appendChild(errorEl);
    }

    if (onRetry) {
      this.bind(`#${errorId} [data-action="retry"]`, 'click', onRetry);
    }
  }

  /**
   * Rend un état vide.
   * @param {string} [message='Aucun contenu disponible.'] - Message
   * @param {string} [icon='📭'] - Icône
   * @param {string} [selector] - Sélecteur cible
   */
  renderEmptyState(message = 'Aucun contenu disponible.', icon = '📭', selector = null) {
    const target = selector ? this.query(selector) : this.container;
    if (!target) return;

    const emptyEl = this.createElement('div', {
      classNames: ['empty-state'],
      attributes: { role: 'status' },
      innerHTML: `
        <div class="empty-icon" aria-hidden="true">${icon}</div>
        <p class="empty-message">${message}</p>
      `
    });

    if (selector) {
      target.innerHTML = '';
      target.appendChild(emptyEl);
    } else {
      this.clear();
      this.container.appendChild(emptyEl);
    }
  }

  // ============================================================
  // Composants UI utilitaires
  // ============================================================

  /**
   * Affiche un toast de notification.
   * @param {string} message - Message à afficher
   * @param {string} [type='info'] - Type: 'info', 'success', 'warning', 'error'
   * @param {number} [duration=3000] - Durée en ms
   */
  showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toast-container') || this._ensureToastContainer();

    const toast = this.createElement('div', {
      classNames: ['toast', `toast--${type}`],
      attributes: {
        role: 'alert',
        'aria-live': 'polite',
        'data-toast': ''
      },
      innerHTML: `
        <span class="toast-icon" aria-hidden="true">${this._getToastIcon(type)}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Fermer la notification">&times;</button>
      `
    });

    toastContainer.appendChild(toast);

    // Animation d'entrée
    requestAnimationFrame(() => {
      toast.classList.add('toast--visible');
    });

    // Fermeture automatique
    const timeout = setTimeout(() => this._removeToast(toast), duration);

    // Fermeture manuelle
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        clearTimeout(timeout);
        this._removeToast(toast);
      });
    }
  }

  /**
   * Affiche une modale.
   * @param {Object} options - Options de la modale
   * @param {string} options.title - Titre
   * @param {string|HTMLElement} options.content - Contenu
   * @param {string} [options.size='medium'] - Taille: 'small', 'medium', 'large', 'fullscreen'
   * @param {boolean} [options.closable=true] - Peut être fermée
   * @param {Function} [options.onClose] - Callback à la fermeture
   * @returns {Object} Contrôles de la modale { close, element }
   */
  showModal(options = {}) {
    const { title, content, size = 'medium', closable = true, onClose } = options;

    const modalId = `modal-${Math.random().toString(36).substr(2, 9)}`;

    // Overlay
    const overlay = this.createElement('div', {
      id: `${modalId}-overlay`,
      classNames: ['modal-overlay'],
      attributes: { 'data-modal-overlay': '', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': `${modalId}-title` }
    });

    // Container
    const modalEl = this.createElement('div', {
      id: modalId,
      classNames: ['modal', `modal--${size}`]
    });

    // Header
    const header = this.createElement('div', {
      classNames: ['modal__header'],
      innerHTML: `
        <h3 id="${modalId}-title" class="modal__title">${title || ''}</h3>
        ${closable ? `<button class="modal__close" aria-label="Fermer">&times;</button>` : ''}
      `
    });

    // Body
    const body = this.createElement('div', {
      classNames: ['modal__body']
    });

    if (content instanceof HTMLElement) {
      body.appendChild(content);
    } else {
      body.innerHTML = content || '';
    }

    modalEl.appendChild(header);
    modalEl.appendChild(body);
    overlay.appendChild(modalEl);

    document.body.appendChild(overlay);

    // Focus trap
    this._trapFocus(overlay);

    // Animation
    requestAnimationFrame(() => {
      overlay.classList.add('modal-overlay--visible');
    });

    // Événements
    const closeModal = () => {
      overlay.classList.remove('modal-overlay--visible');
      setTimeout(() => {
        overlay.remove();
        if (onClose) onClose();
      }, 200);
    };

    if (closable) {
      const closeBtn = overlay.querySelector('.modal__close');
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }

    return { close: closeModal, element: overlay };
  }

  /**
   * Cache/ferme une modale existante.
   * @param {HTMLElement} modalElement - Élément modale retourné par showModal
   */
  hideModal(modalElement) {
    if (modalElement && modalElement.element) {
      modalElement.element.classList.remove('modal-overlay--visible');
      setTimeout(() => modalElement.element.remove(), 200);
    } else if (modalElement) {
      modalElement.classList.remove('modal-overlay--visible');
      setTimeout(() => modalElement.remove(), 200);
    }
  }

  // ============================================================
   // Méthodes privées utilitaires
  // ============================================================

  _ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  _removeToast(toast) {
    toast.classList.remove('toast--visible');
    toast.classList.add('toast--hiding');
    setTimeout(() => toast.remove(), 300);
  }

  _getToastIcon(type) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || icons.info;
  }

  _trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
      if (e.key === 'Escape') {
        const closeBtn = element.querySelector('.modal__close');
        if (closeBtn) closeBtn.click();
      }
    });

    firstFocusable?.focus();
  }

  /**
   * Détruit proprement la view et libère toutes les ressources.
   */
  destroy() {
    this.unmount();
    this.container = null;
    this.controller = null;
    this.components = null;
    this.theme = null;
  }
}
