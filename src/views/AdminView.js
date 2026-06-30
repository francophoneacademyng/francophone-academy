/**
 * AdminView.js
 * View pour l'administration : Utilisateurs, Enseignants, Contenu, Paiements, Configuration, Statistiques.
 *
 * Événements capturés → transmis au AdminController.
 */

import { BaseView } from './BaseView.js';

/**
 * @class AdminView
 * @extends BaseView
 * Gère l'affichage du panneau d'administration.
 */
export class AdminView extends BaseView {
  constructor(options = {}) {
    super({
      viewName: 'AdminView',
      ...options
    });

    this.activeTab = 'overview'; // 'overview' | 'users' | 'teachers' | 'content' | 'payments' | 'settings'
    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.searchQuery = '';
    this.sortField = 'createdAt';
    this.sortDirection = 'desc';
    this.selectedItems = new Set();
  }

  // ============================================================
  // Rendu principal
  // ============================================================

  /**
   * Rend le panneau d'administration.
   * @returns {HTMLElement}
   */
  render() {
    this.clear();

    const wrapper = this.createElement('div', {
      classNames: ['admin-view'],
      attributes: { 'data-admin-view': '' }
    });

    // Sidebar de navigation
    wrapper.appendChild(this._renderSidebar());

    // Contenu principal
    const main = this.createElement('div', {
      classNames: ['admin-main']
    });

    main.appendChild(this._renderHeader());

    const content = this.createElement('div', {
      classNames: ['admin-content'],
      attributes: { 'data-active-tab': this.activeTab }
    });

    switch (this.activeTab) {
      case 'overview':
        content.appendChild(this._renderOverview());
        break;
      case 'users':
        content.appendChild(this._renderUsers());
        break;
      case 'teachers':
        content.appendChild(this._renderTeachers());
        break;
      case 'content':
        content.appendChild(this._renderContent());
        break;
      case 'payments':
        content.appendChild(this._renderPayments());
        break;
      case 'settings':
        content.appendChild(this._renderSettings());
        break;
    }

    main.appendChild(content);
    wrapper.appendChild(main);

    this.container.appendChild(wrapper);
    return this.container;
  }

  // ============================================================
  // Sidebar
  // ============================================================

  /**
   * Rend la sidebar de navigation admin.
   * @returns {HTMLElement}
   * @private
   */
  _renderSidebar() {
    const menuItems = [
      { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
      { id: 'users', label: 'Utilisateurs', icon: '👥' },
      { id: 'teachers', label: 'Enseignants', icon: '👨‍🏫' },
      { id: 'content', label: 'Contenu', icon: '📚' },
      { id: 'payments', label: 'Paiements', icon: '💳' },
      { id: 'settings', label: 'Configuration', icon: '⚙️' }
    ];

    return this.createElement('aside', {
      classNames: ['admin-sidebar'],
      attributes: { 'aria-label': 'Navigation admin' },
      innerHTML: `
        <div class="admin-sidebar__header">
          <h2 class="admin-sidebar__title">🎓 Administration</h2>
        </div>
        <nav class="admin-sidebar__nav" role="navigation">
          <ul class="admin-menu" role="list">
            ${menuItems.map(item => `
              <li class="admin-menu__item">
                <button 
                  class="admin-menu__link ${this.activeTab === item.id ? 'admin-menu__link--active' : ''}"
                  data-tab="${item.id}"
                  role="tab"
                  aria-selected="${this.activeTab === item.id ? 'true' : 'false'}"
                >
                  <span class="admin-menu__icon" aria-hidden="true">${item.icon}</span>
                  <span class="admin-menu__label">${item.label}</span>
                </button>
              </li>
            `).join('')}
          </ul>
        </nav>
        <div class="admin-sidebar__footer">
          <button class="btn btn--text btn--small" data-action="view-site">
            ← Retour au site
          </button>
        </div>
      `
    });
  }

  // ============================================================
  // En-tête de section
  // ============================================================

  /**
   * Rend l'en-tête de la section active.
   * @returns {HTMLElement}
   * @private
   */
  _renderHeader() {
    const titles = {
      overview: 'Vue d\'ensemble',
      users: 'Gestion des utilisateurs',
      teachers: 'Gestion des enseignants',
      content: 'Gestion du contenu',
      payments: 'Paiements et abonnements',
      settings: 'Configuration'
    };

    return this.createElement('header', {
      classNames: ['admin-section-header'],
      innerHTML: `
        <h1 class="admin-section-title">${titles[this.activeTab] || ''}</h1>
        <div class="admin-section-actions">
          ${this.activeTab === 'users' ? `
            <button class="btn btn--primary" data-action="invite-user">
              <span aria-hidden="true">+</span> Inviter un utilisateur
            </button>
          ` : ''}
          ${this.activeTab === 'content' ? `
            <button class="btn btn--primary" data-action="create-content">
              <span aria-hidden="true">+</span> Créer du contenu
            </button>
          ` : ''}
        </div>
      `
    });
  }

  // ============================================================
  // Vue d'ensemble
  // ============================================================

  /**
   * Rend le tableau de bord d'administration.
   * @returns {HTMLElement}
   * @private
   */
  _renderOverview() {
    const stats = this.controller?.getAdminStats?.() || {};

    const section = this.createElement('section', {
      classNames: ['admin-section', 'admin-overview']
    });

    section.innerHTML = `
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon" style="background: #e3f2fd" aria-hidden="true">👥</div>
          <div class="admin-stat-card__content">
            <p class="admin-stat-card__value">${stats.totalUsers || 0}</p>
            <p class="admin-stat-card__label">Utilisateurs</p>
          </div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon" style="background: #f3e5f5" aria-hidden="true">👨‍🏫</div>
          <div class="admin-stat-card__content">
            <p class="admin-stat-card__value">${stats.totalTeachers || 0}</p>
            <p class="admin-stat-card__label">Enseignants</p>
          </div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon" style="background: #e8f5e9" aria-hidden="true">💰</div>
          <div class="admin-stat-card__content">
            <p class="admin-stat-card__value">${stats.monthlyRevenue || '0 €'}</p>
            <p class="admin-stat-card__label">Revenus ce mois</p>
          </div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon" style="background: #fff3e0" aria-hidden="true">📖</div>
          <div class="admin-stat-card__content">
            <p class="admin-stat-card__value">${stats.activeLessons || 0}</p>
            <p class="admin-stat-card__label">Leçons actives</p>
          </div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon" style="background: #fce4ec" aria-hidden="true">📝</div>
          <div class="admin-stat-card__content">
            <p class="admin-stat-card__value">${stats.quizzesTaken || 0}</p>
            <p class="admin-stat-card__label">Quiz passés</p>
          </div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon" style="background: #e0f2f1" aria-hidden="true">🔥</div>
          <div class="admin-stat-card__content">
            <p class="admin-stat-card__value">${stats.engagementRate || '0%'}</p>
            <p class="admin-stat-card__label">Taux d'engagement</p>
          </div>
        </div>
      </div>

      <div class="admin-overview__charts">
        <div class="admin-chart-card">
          <h3 class="admin-chart-card__title">Inscriptions (30 derniers jours)</h3>
          <div class="admin-chart-placeholder" data-chart="registrations">
            <!-- Le graphique est rendu par le controller via une librairie -->
          </div>
        </div>
        <div class="admin-chart-card">
          <h3 class="admin-chart-card__title">Revenus (30 derniers jours)</h3>
          <div class="admin-chart-placeholder" data-chart="revenue">
            <!-- Le graphique est rendu par le controller -->
          </div>
        </div>
      </div>

      <div class="admin-overview__recent">
        <div class="admin-recent-card">
          <h3 class="admin-recent-card__title">Derniers utilisateurs inscrits</h3>
          <ul class="admin-recent-list" role="list">
            ${(stats.recentUsers || []).map(user => `
              <li class="admin-recent-item">
                <span class="admin-recent-item__avatar" aria-hidden="true">👤</span>
                <div class="admin-recent-item__info">
                  <p class="admin-recent-item__name">${this._escapeHtml(user.name)}</p>
                  <p class="admin-recent-item__meta">${this._escapeHtml(user.email)} · ${this._formatRelativeTime(user.createdAt)}</p>
                </div>
                <span class="badge badge--${user.role}">${user.role}</span>
              </li>
            `).join('') || '<li class="admin-recent-item">Aucun utilisateur récent</li>'}
          </ul>
        </div>
        <div class="admin-recent-card">
          <h3 class="admin-recent-card__title">Dernières activités</h3>
          <ul class="admin-recent-list" role="list">
            ${(stats.recentActivities || []).map(activity => `
              <li class="admin-recent-item">
                <span class="admin-recent-item__icon" aria-hidden="true">${activity.icon || '📝'}</span>
                <div class="admin-recent-item__info">
                  <p class="admin-recent-item__text">${this._escapeHtml(activity.text)}</p>
                  <p class="admin-recent-item__time">${this._formatRelativeTime(activity.timestamp)}</p>
                </div>
              </li>
            `).join('') || '<li class="admin-recent-item">Aucune activité récente</li>'}
          </ul>
        </div>
      </div>
    `;

    return section;
  }

  // ============================================================
  // Utilisateurs
  // ============================================================

  /**
   * Rend la gestion des utilisateurs.
   * @returns {HTMLElement}
   * @private
   */
  _renderUsers() {
    const users = this.controller?.getUsers?.({
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchQuery,
      sortField: this.sortField,
      sortDirection: this.sortDirection
    }) || { items: [], total: 0 };

    const totalPages = Math.ceil(users.total / this.itemsPerPage);

    const section = this.createElement('section', {
      classNames: ['admin-section', 'admin-users']
    });

    section.innerHTML = `
      <div class="admin-toolbar">
        <div class="admin-search">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input 
            type="search" 
            class="form-input" 
            placeholder="Rechercher un utilisateur..."
            value="${this._escapeHtml(this.searchQuery)}"
            data-action="search-users"
            aria-label="Rechercher des utilisateurs"
          />
        </div>
        <div class="admin-filters">
          <select class="form-select" data-filter="role" aria-label="Filtrer par rôle">
            <option value="">Tous les rôles</option>
            <option value="student">Étudiant</option>
            <option value="teacher">Enseignant</option>
            <option value="admin">Admin</option>
          </select>
          <select class="form-select" data-filter="status" aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="suspended">Suspendu</option>
          </select>
        </div>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th><input type="checkbox" data-action="select-all" aria-label="Sélectionner tout" /></th>
              <th data-sort="name">Nom ↕</th>
              <th data-sort="email">Email ↕</th>
              <th data-sort="role">Rôle ↕</th>
              <th data-sort="level">Niveau ↕</th>
              <th data-sort="status">Statut ↕</th>
              <th data-sort="createdAt">Inscription ↕</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.items.length === 0
              ? `<tr><td colspan="8" class="admin-table__empty">Aucun utilisateur trouvé</td></tr>`
              : users.items.map((user, index) => `
                <tr class="${this.selectedItems.has(user.id) ? 'admin-table__row--selected' : ''}" data-user-id="${user.id}">
                  <td><input type="checkbox" data-action="select-user" data-user-id="${user.id}" ${this.selectedItems.has(user.id) ? 'checked' : ''} /></td>
                  <td>
                    <div class="user-info">
                      <span class="user-avatar" aria-hidden="true">${user.avatar || '👤'}</span>
                      <span class="user-name">${this._escapeHtml(user.name)}</span>
                    </div>
                  </td>
                  <td>${this._escapeHtml(user.email)}</td>
                  <td><span class="badge badge--${user.role}">${user.role}</span></td>
                  <td><span class="badge badge--${user.level?.toLowerCase()}">${user.level || '-'}</span></td>
                  <td><span class="status-dot status-dot--${user.status}">${user.status}</span></td>
                  <td>${this._formatDate(user.createdAt)}</td>
                  <td>
                    <div class="admin-actions">
                      <button class="btn btn--icon btn--small" data-action="view-user" data-user-id="${user.id}" aria-label="Voir le profil">👁</button>
                      <button class="btn btn--icon btn--small" data-action="edit-user" data-user-id="${user.id}" aria-label="Modifier">✏️</button>
                      <button class="btn btn--icon btn--small" data-action="suspend-user" data-user-id="${user.id}" aria-label="Suspendre">🚫</button>
                    </div>
                  </td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>

      ${this._renderPagination(users.total, totalPages)}
    `;

    return section;
  }

  // ============================================================
  // Enseignants
  // ============================================================

  /**
   * Rend la gestion des enseignants.
   * @returns {HTMLElement}
   * @private
   */
  _renderTeachers() {
    const teachers = this.controller?.getTeachers?.() || [];

    const section = this.createElement('section', {
      classNames: ['admin-section', 'admin-teachers']
    });

    section.innerHTML = `
      <div class="admin-toolbar">
        <button class="btn btn--primary" data-action="add-teacher">
          <span aria-hidden="true">+</span> Ajouter un enseignant
        </button>
      </div>

      ${teachers.length === 0
        ? this._renderEmptyState('Aucun enseignant enregistré', '👨‍🏫')
        : `<div class="teachers-grid">
            ${teachers.map((teacher, index) => `
              <article class="teacher-card" data-teacher-id="${teacher.id}">
                <div class="teacher-card__header">
                  <img src="${teacher.photoURL || '/assets/default-avatar.svg'}" alt="" class="teacher-card__photo" />
                  <div class="teacher-card__info">
                    <h3 class="teacher-card__name">${this._escapeHtml(teacher.name)}</h3>
                    <p class="teacher-card__email">${this._escapeHtml(teacher.email)}</p>
                  </div>
                </div>
                <div class="teacher-card__stats">
                  <div class="teacher-stat">
                    <span class="teacher-stat__value">${teacher.studentCount || 0}</span>
                    <span class="teacher-stat__label">Élèves</span>
                  </div>
                  <div class="teacher-stat">
                    <span class="teacher-stat__value">${teacher.lessonCount || 0}</span>
                    <span class="teacher-stat__label">Leçons</span>
                  </div>
                  <div class="teacher-stat">
                    <span class="teacher-stat__value">${teacher.rating || 'N/A'}</span>
                    <span class="teacher-stat__label">Note</span>
                  </div>
                </div>
                <div class="teacher-card__specialties">
                  ${(teacher.specialties || []).map(s => `<span class="tag">${this._escapeHtml(s)}</span>`).join('')}
                </div>
                <div class="teacher-card__actions">
                  <button class="btn btn--outline btn--small" data-action="view-teacher" data-teacher-id="${teacher.id}">Profil</button>
                  <button class="btn btn--outline btn--small" data-action="edit-teacher" data-teacher-id="${teacher.id}">Modifier</button>
                  <button class="btn btn--danger btn--small" data-action="remove-teacher" data-teacher-id="${teacher.id}">Retirer</button>
                </div>
              </article>
            `).join('')}
          </div>`
      }
    `;

    return section;
  }

  // ============================================================
  // Contenu
  // ============================================================

  /**
   * Rend la gestion du contenu pédagogique.
   * @returns {HTMLElement}
   * @private
   */
  _renderContent() {
    const content = this.controller?.getContentItems?.() || [];

    const section = this.createElement('section', {
      classNames: ['admin-section', 'admin-content']
    });

    section.innerHTML = `
      <div class="admin-toolbar">
        <div class="admin-search">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input 
            type="search" 
            class="form-input" 
            placeholder="Rechercher du contenu..."
            data-action="search-content"
            aria-label="Rechercher du contenu"
          />
        </div>
        <div class="admin-filters">
          <select class="form-select" data-filter="content-type" aria-label="Type de contenu">
            <option value="">Tous les types</option>
            <option value="lesson">Leçon</option>
            <option value="quiz">Quiz</option>
            <option value="exercise">Exercice</option>
          </select>
          <select class="form-select" data-filter="content-level" aria-label="Niveau">
            <option value="">Tous les niveaux</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
          </select>
        </div>
      </div>

      <div class="content-tree">
        ${content.length === 0
          ? this._renderEmptyState('Aucun contenu créé', '📚')
          : content.map((item, index) => `
            <div class="content-tree__item" data-content-id="${item.id}" data-content-type="${item.type}">
              <div class="content-tree__header">
                <span class="content-tree__toggle" aria-hidden="true">▶</span>
                <span class="content-tree__icon" aria-hidden="true">
                  ${item.type === 'lesson' ? '📖' : item.type === 'quiz' ? '📝' : item.type === 'unit' ? '📦' : '📄'}
                </span>
                <span class="content-tree__title">${this._escapeHtml(item.title)}</span>
                <span class="badge badge--${item.level?.toLowerCase()}">${item.level}</span>
                <span class="content-tree__status status-dot status-dot--${item.status}">${item.status}</span>
                <div class="content-tree__actions">
                  <button class="btn btn--icon btn--small" data-action="edit-content" data-content-id="${item.id}" aria-label="Modifier">✏️</button>
                  <button class="btn btn--icon btn--small" data-action="preview-content" data-content-id="${item.id}" aria-label="Aperçu">👁</button>
                  <button class="btn btn--icon btn--small" data-action="delete-content" data-content-id="${item.id}" aria-label="Supprimer">🗑️</button>
                </div>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;

    return section;
  }

  // ============================================================
  // Paiements
  // ============================================================

  /**
   * Rend la gestion des paiements et abonnements.
   * @returns {HTMLElement}
   * @private
   */
  _renderPayments() {
    const payments = this.controller?.getPayments?.() || [];
    const plans = this.controller?.getSubscriptionPlans?.() || [];

    const section = this.createElement('section', {
      classNames: ['admin-section', 'admin-payments']
    });

    section.innerHTML = `
      <div class="admin-payments__plans">
        <h3 class="admin-subsection-title">Forfaits d'abonnement</h3>
        <div class="plans-grid">
          ${plans.map(plan => `
            <div class="plan-card ${plan.active ? '' : 'plan-card--inactive'}" data-plan-id="${plan.id}">
              <h4 class="plan-card__name">${this._escapeHtml(plan.name)}</h4>
              <p class="plan-card__price">${this._escapeHtml(plan.price)}</p>
              <p class="plan-card__period">${this._escapeHtml(plan.period)}</p>
              <ul class="plan-card__features">
                ${(plan.features || []).map(f => `<li>${this._escapeHtml(f)}</li>`).join('')}
              </ul>
              <div class="plan-card__actions">
                <button class="btn btn--outline btn--small" data-action="edit-plan" data-plan-id="${plan.id}">Modifier</button>
                <button class="btn btn--${plan.active ? 'danger' : 'primary'} btn--small" data-action="toggle-plan" data-plan-id="${plan.id}">
                  ${plan.active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="admin-payments__transactions">
        <h3 class="admin-subsection-title">Transactions récentes</h3>
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Forfait</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${payments.length === 0
                ? `<tr><td colspan="6" class="admin-table__empty">Aucune transaction</td></tr>`
                : payments.map(p => `
                  <tr data-payment-id="${p.id}">
                    <td>${this._formatDate(p.date)}</td>
                    <td>${this._escapeHtml(p.userName)}</td>
                    <td>${this._escapeHtml(p.planName)}</td>
                    <td>${this._escapeHtml(p.amount)}</td>
                    <td><span class="status-dot status-dot--${p.status}">${p.status}</span></td>
                    <td>
                      <button class="btn btn--icon btn--small" data-action="view-payment" data-payment-id="${p.id}">👁</button>
                    </td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    return section;
  }

  // ============================================================
  // Configuration
  // ============================================================

  /**
   * Rend les paramètres de configuration.
   * @returns {HTMLElement}
   * @private
   */
  _renderSettings() {
    const settings = this.controller?.getSettings?.() || {};

    const section = this.createElement('section', {
      classNames: ['admin-section', 'admin-settings']
    });

    section.innerHTML = `
      <form class="admin-settings__form" id="admin-settings-form">
        <fieldset class="settings-group">
          <legend class="settings-group__title">Général</legend>
          <div class="form-group">
            <label for="site-name" class="form-label">Nom du site</label>
            <input type="text" id="site-name" name="siteName" class="form-input" value="${this._escapeHtml(settings.siteName || 'Francophone Academy')}" />
          </div>
          <div class="form-group">
            <label for="site-description" class="form-label">Description</label>
            <textarea id="site-description" name="siteDescription" class="form-textarea" rows="3">${this._escapeHtml(settings.siteDescription || '')}</textarea>
          </div>
          <div class="form-group">
            <label for="contact-email" class="form-label">Email de contact</label>
            <input type="email" id="contact-email" name="contactEmail" class="form-input" value="${this._escapeHtml(settings.contactEmail || '')}" />
          </div>
        </fieldset>

        <fieldset class="settings-group">
          <legend class="settings-group__title">Inscriptions</legend>
          <label class="form-checkbox">
            <input type="checkbox" name="allowRegistration" ${settings.allowRegistration !== false ? 'checked' : ''} />
            <span>Autoriser les nouvelles inscriptions</span>
          </label>
          <label class="form-checkbox">
            <input type="checkbox" name="requireEmailVerification" ${settings.requireEmailVerification !== false ? 'checked' : ''} />
            <span>Exiger la vérification d'email</span>
          </label>
        </fieldset>

        <fieldset class="settings-group">
          <legend class="settings-group__title">Modèle IA par défaut</legend>
          <div class="form-group">
            <label for="default-ai-model" class="form-label">Modèle</label>
            <select id="default-ai-model" name="defaultAiModel" class="form-select">
              <option value="gpt-4" ${settings.defaultAiModel === 'gpt-4' ? 'selected' : ''}>GPT-4 (Premium)</option>
              <option value="gpt-3.5" ${settings.defaultAiModel === 'gpt-3.5' ? 'selected' : ''}>GPT-3.5</option>
            </select>
          </div>
        </fieldset>

        <fieldset class="settings-group">
          <legend class="settings-group__title">Danger Zone</legend>
          <div class="danger-zone">
            <div class="danger-zone__item">
              <div>
                <p><strong>Supprimer toutes les données</strong></p>
                <p class="danger-zone__desc">Cette action est irréversible.</p>
              </div>
              <button type="button" class="btn btn--danger" data-action="reset-data">Supprimer</button>
            </div>
          </div>
        </fieldset>

        <div class="form-actions">
          <button type="submit" class="btn btn--primary">Enregistrer les paramètres</button>
          <button type="reset" class="btn btn--outline">Annuler</button>
        </div>
      </form>
    `;

    return section;
  }

  // ============================================================
  // Pagination
  // ============================================================

  /**
   * Rend la pagination.
   * @param {number} total
   * @param {number} totalPages
   * @returns {string}
   * @private
   */
  _renderPagination(total, totalPages) {
    if (totalPages <= 1) return '';

    let pages = '';
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
        pages += `<button class="btn btn--small ${i === this.currentPage ? 'btn--primary' : 'btn--outline'}" data-page="${i}">${i}</button>`;
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        pages += '<span class="pagination-ellipsis">...</span>';
      }
    }

    return `
      <div class="admin-pagination">
        <span class="pagination-info">${total} résultat${total > 1 ? 's' : ''}</span>
        <div class="pagination-controls">
          <button class="btn btn--small btn--outline" data-action="prev-page" ${this.currentPage === 1 ? 'disabled' : ''}>←</button>
          ${pages}
          <button class="btn btn--small btn--outline" data-action="next-page" ${this.currentPage === totalPages ? 'disabled' : ''}>→</button>
        </div>
      </div>
    `;
  }

  // ============================================================
  // Navigation
  // ============================================================

  /**
   * Navigue vers un onglet admin.
   * @param {string} tab
   */
  navigateToTab(tab) {
    this.activeTab = tab;
    this.currentPage = 1;
    this.searchQuery = '';
    this.selectedItems.clear();
    this.render();
  }

  // ============================================================
  // Événements
  // ============================================================

  _bindEvents() {
    // Navigation par onglets
    this.queryAll('[data-tab]').forEach(tab => {
      this.bind(tab, 'click', (e) => {
        this.navigateToTab(e.currentTarget.dataset.tab);
      });
    });

    // Retour au site
    this.bind('[data-action="view-site"]', 'click', () => {
      this.controller?.onViewSite?.();
    });

    // Utilisateurs - recherche
    this.bind('[data-action="search-users"]', 'input', (e) => {
      this.searchQuery = e.target.value;
      this.currentPage = 1;
      // Debounce
      clearTimeout(this._searchTimeout);
      this._searchTimeout = setTimeout(() => {
        this.render();
      }, 300);
    });

    // Tri du tableau
    this.queryAll('th[data-sort]').forEach(th => {
      this.bind(th, 'click', (e) => {
        const field = e.currentTarget.dataset.sort;
        if (this.sortField === field) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortField = field;
          this.sortDirection = 'asc';
        }
        this.render();
      });
    });

    // Sélection d'utilisateurs
    this.bind('[data-action="select-all"]', 'change', (e) => {
      const checked = e.target.checked;
      this.queryAll('[data-action="select-user"]').forEach(cb => {
        cb.checked = checked;
        const userId = cb.dataset.userId;
        if (checked) this.selectedItems.add(userId);
        else this.selectedItems.delete(userId);
      });
    });

    this.queryAll('[data-action="select-user"]').forEach(cb => {
      this.bind(cb, 'change', (e) => {
        const userId = e.currentTarget.dataset.userId;
        if (e.target.checked) this.selectedItems.add(userId);
        else this.selectedItems.delete(userId);
      });
    });

    // Actions utilisateurs
    this.queryAll('[data-action="view-user"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        this.controller?.onViewUser?.(e.currentTarget.dataset.userId);
      });
    });

    this.queryAll('[data-action="edit-user"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        this.controller?.onEditUser?.(e.currentTarget.dataset.userId);
      });
    });

    this.queryAll('[data-action="suspend-user"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        if (confirm('Voulez-vous suspendre cet utilisateur ?')) {
          this.controller?.onSuspendUser?.(e.currentTarget.dataset.userId);
        }
      });
    });

    this.bind('[data-action="invite-user"]', 'click', () => {
      this.controller?.onInviteUser?.();
    });

    // Pagination
    this.bind('[data-action="prev-page"]', 'click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.render();
      }
    });

    this.bind('[data-action="next-page"]', 'click', () => {
      this.currentPage++;
      this.render();
    });

    this.queryAll('[data-page]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        this.currentPage = parseInt(e.currentTarget.dataset.page);
        this.render();
      });
    });

    // Enseignants
    this.bind('[data-action="add-teacher"]', 'click', () => {
      this.controller?.onAddTeacher?.();
    });

    this.queryAll('[data-action="view-teacher"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        this.controller?.onViewTeacher?.(e.currentTarget.dataset.teacherId);
      });
    });

    this.queryAll('[data-action="edit-teacher"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        this.controller?.onEditTeacher?.(e.currentTarget.dataset.teacherId);
      });
    });

    this.queryAll('[data-action="remove-teacher"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        if (confirm('Retirer cet enseignant ?')) {
          this.controller?.onRemoveTeacher?.(e.currentTarget.dataset.teacherId);
        }
      });
    });

    // Contenu
    this.bind('[data-action="create-content"]', 'click', () => {
      this.controller?.onCreateContent?.();
    });

    this.queryAll('[data-action="edit-content"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        this.controller?.onEditContent?.(e.currentTarget.dataset.contentId);
      });
    });

    this.queryAll('[data-action="preview-content"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        this.controller?.onPreviewContent?.(e.currentTarget.dataset.contentId);
      });
    });

    this.queryAll('[data-action="delete-content"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        if (confirm('Supprimer ce contenu ?')) {
          this.controller?.onDeleteContent?.(e.currentTarget.dataset.contentId);
        }
      });
    });

    // Paiements
    this.queryAll('[data-action="edit-plan"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        this.controller?.onEditPlan?.(e.currentTarget.dataset.planId);
      });
    });

    this.queryAll('[data-action="toggle-plan"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        this.controller?.onTogglePlan?.(e.currentTarget.dataset.planId);
      });
    });

    this.queryAll('[data-action="view-payment"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        this.controller?.onViewPayment?.(e.currentTarget.dataset.paymentId);
      });
    });

    // Configuration
    const settingsForm = this.query('#admin-settings-form');
    if (settingsForm) {
      this.bind(settingsForm, 'submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        // Convertir les checkboxes
        data.allowRegistration = formData.has('allowRegistration');
        data.requireEmailVerification = formData.has('requireEmailVerification');
        this.controller?.onSaveSettings?.(data);
      });
    }

    this.bind('[data-action="reset-data"]', 'click', () => {
      if (confirm('⚠️ Êtes-vous absolument sûr ? Cette action supprimera TOUTES les données.')) {
        if (confirm('Vraiment ? Cette action est IRRÉVERSIBLE.')) {
          this.controller?.onResetData?.();
        }
      }
    });
  }

  // ============================================================
  // Utilitaires
  // ============================================================

  _formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  _formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  }

  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
