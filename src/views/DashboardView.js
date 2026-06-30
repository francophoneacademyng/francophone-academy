/**
 * DashboardView.js
 * View du tableau de bord : statistiques, progression, planning, activités, notifications, recommandations.
 *
 * Événements capturés → transmis au DashboardController.
 */

import { BaseView } from './BaseView.js';

/**
 * @class DashboardView
 * @extends BaseView
 * Gère l'affichage du tableau de bord étudiant et enseignant.
 */
export class DashboardView extends BaseView {
  constructor(options = {}) {
    super({
      viewName: 'DashboardView',
      ...options
    });

    this.statsData = null;
    this.progressData = null;
    this.activitiesData = [];
    this.notificationsData = [];
    this.recommendationsData = [];
  }

  // ============================================================
  // Rendu principal
  // ============================================================

  /**
   * Rend le tableau de bord complet.
   * @returns {HTMLElement}
   */
  render() {
    this.clear();

    const wrapper = this.createElement('div', {
      classNames: ['dashboard-view'],
      attributes: { 'data-dashboard': '' }
    });

    // En-tête du dashboard
    wrapper.appendChild(this._renderHeader());

    // Contenu principal en grille
    const grid = this.createElement('div', {
      classNames: ['dashboard-grid']
    });

    // Colonne principale
    const mainColumn = this.createElement('div', {
      classNames: ['dashboard-main']
    });

    mainColumn.appendChild(this._renderStatsCards());
    mainColumn.appendChild(this._renderProgressSection());
    mainColumn.appendChild(this._renderScheduleSection());
    mainColumn.appendChild(this._renderRecentActivity());

    // Colonne latérale
    const sideColumn = this.createElement('div', {
      classNames: ['dashboard-sidebar']
    });

    sideColumn.appendChild(this._renderNotifications());
    sideColumn.appendChild(this._renderRecommendations());

    grid.appendChild(mainColumn);
    grid.appendChild(sideColumn);
    wrapper.appendChild(grid);

    this.container.appendChild(wrapper);
    return this.container;
  }

  // ============================================================
  // En-tête
  // ============================================================

  /**
   * Rend l'en-tête du tableau de bord avec salutation.
   * @returns {HTMLElement}
   * @private
   */
  _renderHeader() {
    const hour = new Date().getHours();
    let greeting = 'Bonjour';
    if (hour >= 18) greeting = 'Bonsoir';
    else if (hour < 12) greeting = 'Bonjour';

    const userName = this.controller?.getUserName?.() || '';

    return this.createElement('header', {
      classNames: ['dashboard-header'],
      innerHTML: `
        <div class="dashboard-header__content">
          <h1 class="dashboard-header__greeting">${greeting}, ${this._escapeHtml(userName)} 👋</h1>
          <p class="dashboard-header__date">${this._formatDate(new Date())}</p>
        </div>
        <div class="dashboard-header__actions">
          <button class="btn btn--icon" data-action="refresh" aria-label="Actualiser le tableau de bord">
            <span aria-hidden="true">🔄</span>
          </button>
          <button class="btn btn--icon" data-action="settings" aria-label="Paramètres">
            <span aria-hidden="true">⚙️</span>
          </button>
        </div>
      `
    });
  }

  // ============================================================
  // Cartes statistiques
  // ============================================================

  /**
   * Rend les cartes de statistiques.
   * @returns {HTMLElement}
   * @private
   */
  _renderStatsCards() {
    const stats = this.statsData || this._getDefaultStats();

    const section = this.createElement('section', {
      classNames: ['dashboard-section', 'stats-cards'],
      attributes: { 'aria-labelledby': 'stats-title' }
    });

    section.innerHTML = `
      <h2 id="stats-title" class="visually-hidden">Statistiques</h2>
      <div class="stats-grid">
        ${stats.map((stat, index) => `
          <article class="stat-card" data-stat-index="${index}">
            <div class="stat-card__icon" style="background-color: ${stat.bgColor}" aria-hidden="true">
              ${stat.icon}
            </div>
            <div class="stat-card__content">
              <p class="stat-card__label">${stat.label}</p>
              <p class="stat-card__value">${stat.value}</p>
              ${stat.change !== undefined ? `
                <span class="stat-card__change ${stat.change >= 0 ? 'stat-card__change--up' : 'stat-card__change--down'}">
                  ${stat.change >= 0 ? '↑' : '↓'} ${Math.abs(stat.change)}%
                </span>
              ` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    `;

    return section;
  }

  /**
   * Retourne les statistiques par défaut.
   * @returns {Array<Object>}
   * @private
   */
  _getDefaultStats() {
    return [
      { icon: '📚', label: 'Leçons terminées', value: '0', change: 0, bgColor: '#e3f2fd' },
      { icon: '⏱️', label: 'Heures d\'étude', value: '0h', change: 0, bgColor: '#f3e5f5' },
      { icon: '🎯', label: 'Score moyen', value: '0%', change: 0, bgColor: '#e8f5e9' },
      { icon: '🔥', label: 'Série actuelle', value: '0 jours', change: 0, bgColor: '#fff3e0' }
    ];
  }

  // ============================================================
  // Section: Progression
  // ============================================================

  /**
   * Rend la section de progression CECRL.
   * @returns {HTMLElement}
   * @private
   */
  _renderProgressSection() {
    const progress = this.progressData || { currentLevel: 'A1', nextLevel: 'A2', percentage: 0 };
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(progress.currentLevel);

    const section = this.createElement('section', {
      classNames: ['dashboard-section', 'progress-section'],
      attributes: { 'aria-labelledby': 'progress-title' }
    });

    section.innerHTML = `
      <div class="section-header">
        <h2 id="progress-title" class="section-title">Ma progression</h2>
        <button class="btn btn--text" data-action="view-details">Voir les détails →</button>
      </div>

      <div class="progress-levels">
        ${levels.map((level, index) => `
          <div class="progress-level ${index < currentIndex ? 'progress-level--completed' : ''} ${index === currentIndex ? 'progress-level--current' : ''} ${index > currentIndex ? 'progress-level--locked' : ''}">
            <div class="progress-level__badge">${level}</div>
            <span class="progress-level__label">${this._getLevelLabel(level)}</span>
          </div>
        `).join('')}
      </div>

      <div class="progress-bar-container">
        <div class="progress-bar" role="progressbar" aria-valuenow="${progress.percentage}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-bar__fill" style="width: ${progress.percentage}%"></div>
        </div>
        <div class="progress-bar__labels">
          <span>${progress.currentLevel}</span>
          <span>${progress.percentage}% vers ${progress.nextLevel}</span>
          <span>${progress.nextLevel}</span>
        </div>
      </div>

      <div class="progress-skills" id="progress-skills">
        <!-- Rempli dynamiquement via updateProgressSkills -->
      </div>
    `;

    return section;
  }

  /**
   * Retourne le label d'un niveau CECRL.
   * @param {string} level
   * @returns {string}
   * @private
   */
  _getLevelLabel(level) {
    const labels = {
      A1: 'Débutant',
      A2: 'Élémentaire',
      B1: 'Intermédiaire',
      B2: 'Avancé',
      C1: 'Autonome',
      C2: 'Maîtrise'
    };
    return labels[level] || level;
  }

  // ============================================================
  // Section: Planning
  // ============================================================

  /**
   * Rend la section de planning quotidien.
   * @returns {HTMLElement}
   * @private
   */
  _renderScheduleSection() {
    const events = this.scheduleData || [];

    const section = this.createElement('section', {
      classNames: ['dashboard-section', 'schedule-section'],
      attributes: { 'aria-labelledby': 'schedule-title' }
    });

    section.innerHTML = `
      <div class="section-header">
        <h2 id="schedule-title" class="section-title">Planning du jour</h2>
        <button class="btn btn--text" data-action="view-calendar">Voir le calendrier →</button>
      </div>

      ${events.length === 0 ? `
        <div class="schedule-empty">
          <p>Aucune activité prévue aujourd'hui</p>
          <button class="btn btn--primary" data-action="plan-session">Planifier une session</button>
        </div>
      ` : `
        <ul class="schedule-list" role="list">
          ${events.map((event, index) => `
            <li class="schedule-item ${event.completed ? 'schedule-item--completed' : ''}" data-event-index="${index}">
              <div class="schedule-item__time">
                <span class="schedule-item__hour">${event.time}</span>
              </div>
              <div class="schedule-item__content">
                <span class="schedule-item__icon" aria-hidden="true">${event.icon || '📖'}</span>
                <div class="schedule-item__details">
                  <p class="schedule-item__title">${this._escapeHtml(event.title)}</p>
                  <p class="schedule-item__meta">${this._escapeHtml(event.duration || '')} · ${this._escapeHtml(event.type || '')}</p>
                </div>
              </div>
              <div class="schedule-item__actions">
                ${event.completed 
                  ? '<span class="schedule-item__check" aria-label="Terminé">✅</span>'
                  : `<button class="btn btn--icon btn--small" data-action="complete-event" data-index="${index}" aria-label="Marquer comme terminé">⭕</button>`
                }
              </div>
            </li>
          `).join('')}
        </ul>
      `}
    `;

    return section;
  }

  // ============================================================
  // Section: Activités récentes
  // ============================================================

  /**
   * Rend la section des activités récentes.
   * @returns {HTMLElement}
   * @private
   */
  _renderRecentActivity() {
    const activities = this.activitiesData || [];

    const section = this.createElement('section', {
      classNames: ['dashboard-section', 'activity-section'],
      attributes: { 'aria-labelledby': 'activity-title' }
    });

    section.innerHTML = `
      <div class="section-header">
        <h2 id="activity-title" class="section-title">Activités récentes</h2>
        <button class="btn btn--text" data-action="view-all-activities">Tout voir →</button>
      </div>

      ${activities.length === 0
        ? this._renderEmptyState('Aucune activité récente', '📋')
        : `
          <ul class="activity-list" role="list">
            ${activities.map((activity, index) => `
              <li class="activity-item" data-activity-index="${index}">
                <div class="activity-item__icon" style="background-color: ${activity.bgColor || '#f5f5f5'}" aria-hidden="true">
                  ${activity.icon || '•'}
                </div>
                <div class="activity-item__content">
                  <p class="activity-item__title">${this._escapeHtml(activity.title)}</p>
                  <p class="activity-item__meta">
                    <span>${this._escapeHtml(activity.type)}</span>
                    <span>·</span>
                    <span>${this._formatRelativeTime(activity.timestamp)}</span>
                  </p>
                </div>
                ${activity.score !== undefined ? `
                  <span class="activity-item__score ${activity.score >= 70 ? 'score--good' : activity.score >= 50 ? 'score--average' : 'score--poor'}">
                    ${activity.score}%
                  </span>
                ` : ''}
              </li>
            `).join('')}
          </ul>
        `
      }
    `;

    return section;
  }

  // ============================================================
  // Section: Notifications
  // ============================================================

  /**
   * Rend le panneau de notifications.
   * @returns {HTMLElement}
   * @private
   */
  _renderNotifications() {
    const notifications = this.notificationsData || [];
    const unreadCount = notifications.filter(n => !n.read).length;

    const section = this.createElement('section', {
      classNames: ['dashboard-section', 'notifications-section'],
      attributes: { 'aria-labelledby': 'notifications-title' }
    });

    section.innerHTML = `
      <div class="section-header">
        <h2 id="notifications-title" class="section-title">
          Notifications
          ${unreadCount > 0 ? `<span class="badge badge--count">${unreadCount}</span>` : ''}
        </h2>
        ${notifications.length > 0 ? `
          <button class="btn btn--text btn--small" data-action="mark-all-read">Tout lire</button>
        ` : ''}
      </div>

      ${notifications.length === 0
        ? this._renderEmptyState('Aucune notification', '🔕')
        : `
          <ul class="notification-list" role="list" aria-label="Notifications">
            ${notifications.map((notif, index) => `
              <li class="notification-item ${notif.read ? 'notification-item--read' : 'notification-item--unread'}" 
                  data-notification-index="${index}" 
                  role="listitem"
                  tabindex="0">
                <div class="notification-item__icon" aria-hidden="true">${notif.icon || '🔔'}</div>
                <div class="notification-item__content">
                  <p class="notification-item__title">${this._escapeHtml(notif.title)}</p>
                  <p class="notification-item__message">${this._escapeHtml(notif.message)}</p>
                  <time class="notification-item__time" datetime="${notif.timestamp || ''}">
                    ${this._formatRelativeTime(notif.timestamp)}
                  </time>
                </div>
                ${!notif.read ? '<span class="notification-item__unread-dot" aria-hidden="true"></span>' : ''}
              </li>
            `).join('')}
          </ul>
        `
      }
    `;

    return section;
  }

  // ============================================================
  // Section: Recommandations
  // ============================================================

  /**
   * Rend les recommandations personnalisées.
   * @returns {HTMLElement}
   * @private
   */
  _renderRecommendations() {
    const recommendations = this.recommendationsData || [];

    const section = this.createElement('section', {
      classNames: ['dashboard-section', 'recommendations-section'],
      attributes: { 'aria-labelledby': 'recommendations-title' }
    });

    section.innerHTML = `
      <div class="section-header">
        <h2 id="recommendations-title" class="section-title">Recommandations</h2>
      </div>

      ${recommendations.length === 0
        ? this._renderEmptyState('Aucune recommandation pour le moment', '💡')
        : `
          <ul class="recommendation-list" role="list">
            ${recommendations.map((rec, index) => `
              <li class="recommendation-card" data-recommendation-index="${index}">
                <div class="recommendation-card__header">
                  <span class="recommendation-card__icon" aria-hidden="true">${rec.icon || '💡'}</span>
                  <span class="recommendation-card__type">${this._escapeHtml(rec.type || 'Recommandation')}</span>
                </div>
                <h3 class="recommendation-card__title">${this._escapeHtml(rec.title)}</h3>
                <p class="recommendation-card__description">${this._escapeHtml(rec.description)}</p>
                <button class="btn btn--primary btn--small" data-action="start-recommendation" data-index="${index}">
                  ${this._escapeHtml(rec.actionLabel || 'Commencer')}
                </button>
              </li>
            `).join('')}
          </ul>
        `
      }
    `;

    return section;
  }

  // ============================================================
  // Mise à jour des données
  // ============================================================

  /**
   * Met à jour les cartes de statistiques.
   * @param {Array<Object>} stats
   */
  updateStats(stats) {
    this.statsData = stats;
    const container = this.query('.stats-grid');
    if (!container) return;

    const cards = container.querySelectorAll('.stat-card');
    stats.forEach((stat, index) => {
      const card = cards[index];
      if (!card) return;

      const valueEl = card.querySelector('.stat-card__value');
      const changeEl = card.querySelector('.stat-card__change');

      if (valueEl) valueEl.textContent = stat.value;
      if (changeEl) {
        changeEl.className = `stat-card__change ${stat.change >= 0 ? 'stat-card__change--up' : 'stat-card__change--down'}`;
        changeEl.innerHTML = `${stat.change >= 0 ? '↑' : '↓'} ${Math.abs(stat.change)}%`;
      }
    });
  }

  /**
   * Met à jour la progression.
   * @param {Object} progress
   */
  updateProgress(progress) {
    this.progressData = progress;
    const skillsContainer = this.query('.progress-skills');
    if (!skillsContainer) return;

    skillsContainer.innerHTML = (progress.skills || []).map(skill => `
      <div class="progress-skill">
        <div class="progress-skill__header">
          <span class="progress-skill__name">${this._escapeHtml(skill.name)}</span>
          <span class="progress-skill__value">${skill.percentage}%</span>
        </div>
        <div class="progress-bar progress-bar--small">
          <div class="progress-bar__fill" style="width: ${skill.percentage}%"></div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Met à jour le planning.
   * @param {Array<Object>} events
   */
  updateSchedule(events) {
    this.scheduleData = events;
    const section = this.query('.schedule-section');
    if (section) {
      section.replaceWith(this._renderScheduleSection());
      this._rebindSectionEvents(section);
    }
  }

  /**
   * Met à jour les activités récentes.
   * @param {Array<Object>} activities
   */
  updateActivities(activities) {
    this.activitiesData = activities;
    const section = this.query('.activity-section');
    if (section) {
      section.replaceWith(this._renderRecentActivity());
      this._rebindSectionEvents(section);
    }
  }

  /**
   * Met à jour les notifications.
   * @param {Array<Object>} notifications
   */
  updateNotifications(notifications) {
    this.notificationsData = notifications;
    const section = this.query('.notifications-section');
    if (section) {
      section.replaceWith(this._renderNotifications());
      this._rebindSectionEvents(section);
    }
  }

  /**
   * Met à jour les recommandations.
   * @param {Array<Object>} recommendations
   */
  updateRecommendations(recommendations) {
    this.recommendationsData = recommendations;
    const section = this.query('.recommendations-section');
    if (section) {
      section.replaceWith(this._renderRecommendations());
      this._rebindSectionEvents(section);
    }
  }

  /**
   * Marque une notification comme lue dans l'UI.
   * @param {number} index
   */
  markNotificationRead(index) {
    const item = this.query(`[data-notification-index="${index}"]`);
    if (item) {
      item.classList.remove('notification-item--unread');
      item.classList.add('notification-item--read');
      const dot = item.querySelector('.notification-item__unread-dot');
      if (dot) dot.remove();
    }
  }

  // ============================================================
  // Événements
  // ============================================================

  _bindEvents() {
    // Actions d'en-tête
    this.bind('[data-action="refresh"]', 'click', () => {
      this.controller?.onRefresh?.();
    });

    this.bind('[data-action="settings"]', 'click', () => {
      this.controller?.onNavigateSettings?.();
    });

    // Voir détails progression
    this.bind('[data-action="view-details"]', 'click', () => {
      this.controller?.onViewProgressDetails?.();
    });

    // Voir calendrier
    this.bind('[data-action="view-calendar"]', 'click', () => {
      this.controller?.onViewCalendar?.();
    });

    // Planifier une session
    this.bind('[data-action="plan-session"]', 'click', () => {
      this.controller?.onPlanSession?.();
    });

    // Compléter un événement
    this.queryAll('[data-action="complete-event"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.controller?.onCompleteEvent?.(index);
      });
    });

    // Voir toutes les activités
    this.bind('[data-action="view-all-activities"]', 'click', () => {
      this.controller?.onViewAllActivities?.();
    });

    // Notifications
    this.bind('[data-action="mark-all-read"]', 'click', () => {
      this.controller?.onMarkAllNotificationsRead?.();
    });

    this.queryAll('[data-notification-index]').forEach(item => {
      this.bind(item, 'click', (e) => {
        const index = parseInt(e.currentTarget.dataset.notificationIndex);
        this.controller?.onNotificationClick?.(index);
      });
    });

    // Recommandations
    this.queryAll('[data-action="start-recommendation"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.controller?.onStartRecommendation?.(index);
      });
    });

    // Cartes statistiques cliquables
    this.queryAll('.stat-card').forEach(card => {
      this.bind(card, 'click', () => {
        const index = parseInt(card.dataset.statIndex);
        this.controller?.onStatCardClick?.(index);
      });
    });
  }

  /**
   * Rebind les événements après un re-render partiel.
   * @private
   */
  _rebindSectionEvents(section) {
    // Les événements sont rebindés globalement dans _bindEvents
    this._bindEvents();
  }

  _renderEmptyState(message, icon = '📭') {
    return `
      <div class="empty-state" role="status">
        <div class="empty-icon" aria-hidden="true">${icon}</div>
        <p class="empty-message">${this._escapeHtml(message)}</p>
      </div>
    `;
  }

  // ============================================================
  // Utilitaires
  // ============================================================

  _formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  _formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'à l\'instant';
    if (diffMin < 60) return `il y a ${diffMin} min`;
    if (diffHour < 24) return `il y a ${diffHour}h`;
    if (diffDay < 7) return `il y a ${diffDay}j`;
    return this._formatDate(date);
  }

  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
