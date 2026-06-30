/**
 * DashboardController.js
 * Controller du tableau de bord — connecte DashboardView aux services reels via AIService.
 *
 * Architecture : View -> Controller -> AIService -> StudentService -> Repository -> Firestore
 */

import { aiService } from '../services/AIService.js';
import { AuthController } from './AuthController.js';

/**
 * @class DashboardController
 * Gere le tableau de bord avec des donnees Firestore reelles.
 */
export class DashboardController {
  constructor() {
    this.view = null;
    this._user = null;
    this._caches = {};
  }

  setView(view) {
    this.view = view;
  }

  // ============================================
  // UTILISATEUR
  // ============================================

  getUserName() {
    const sessionUser = AuthController.getCurrentUser();
    return sessionUser?.displayName || 'Utilisateur';
  }

  getUserId() {
    const sessionUser = AuthController.getCurrentUser();
    return sessionUser?.uid || null;
  }

  /**
   * Charge toutes les donnees du dashboard depuis Firestore.
   * Appelle les methodes d'update de la view pour afficher les donnees.
   */
  async loadDashboardData() {
    const uid = this.getUserId();

    this.view.render();

    if (!uid) {
      this._applyFallbackData();
      this.view.showToast('Session invalide. Veuillez vous reconnecter.', 'warning', 5000);
      return;
    }

    this.view.renderLoading('Chargement de vos donnees...');

    try {
      const [dashboardData, stats, formattedProgress, activities, notifications, recommendations, schedule] = await Promise.allSettled([
        aiService.getDashboardData(uid),
        aiService.getStats(uid),
        aiService.getFormattedProgress(uid),
        aiService.getRecentActivities(uid),
        aiService.getNotifications(),
        aiService.getRecommendations(uid),
        aiService.getSchedule()
      ]);

      const dashboardResult = dashboardData.status === 'fulfilled' ? dashboardData.value : null;
      const statsResult = stats.status === 'fulfilled' ? stats.value : this._defaultStats();
      const progressResult = formattedProgress.status === 'fulfilled' ? formattedProgress.value : this._defaultProgress();
      const activitiesResult = activities.status === 'fulfilled' ? activities.value : [];
      const notificationsResult = notifications.status === 'fulfilled' ? notifications.value : [];
      const recommendationsResult = recommendations.status === 'fulfilled' ? recommendations.value : [];
      const scheduleResult = schedule.status === 'fulfilled' ? schedule.value : [];

      this._user = dashboardResult?.user || null;

      this.view.render();
      this.view.updateStats(Array.isArray(statsResult) ? statsResult : this._defaultStats());
      this.view.updateProgress(progressResult || this._defaultProgress());
      this.view.updateSchedule(Array.isArray(scheduleResult) ? scheduleResult : []);
      this.view.updateActivities(Array.isArray(activitiesResult) ? activitiesResult : []);
      this.view.updateNotifications(Array.isArray(notificationsResult) ? notificationsResult : []);
      this.view.updateRecommendations(Array.isArray(recommendationsResult) ? recommendationsResult : []);

      if (dashboardData.status === 'rejected' || stats.status === 'rejected' || formattedProgress.status === 'rejected') {
        this.view.showToast('Vos donnees ne sont pas encore disponibles, affichage de secours.', 'warning', 5000);
      }

    } catch (err) {
      console.error('[DashboardController.loadDashboardData]', err);
      this._applyFallbackData();
      this.view.showToast('Mode hors ligne : contenu de secours affiche.', 'warning', 5000);
    }
  }

  _applyFallbackData() {
    this.view.render();
    this.view.updateStats(this._defaultStats());
    this.view.updateProgress(this._defaultProgress());
    this.view.updateSchedule([]);
    this.view.updateActivities([]);
    this.view.updateNotifications([]);
    this.view.updateRecommendations([]);
  }

  // ============================================
  // STATS
  // ============================================

  async getStats() {
    const uid = this.getUserId();
    if (!uid) return this._defaultStats();
    return aiService.getStats(uid);
  }

  // ============================================
  // PROGRESSION
  // ============================================

  async getProgress() {
    const uid = this.getUserId();
    if (!uid) return this._defaultProgress();
    return aiService.getFormattedProgress(uid);
  }

  // ============================================
  // SCHEDULE
  // ============================================

  async getSchedule() {
    return aiService.getSchedule();
  }

  // ============================================
  // ACTIVITIES
  // ============================================

  async getActivities() {
    const uid = this.getUserId();
    if (!uid) return [];
    return aiService.getRecentActivities(uid);
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async getNotifications() {
    return aiService.getNotifications();
  }

  // ============================================
  // RECOMMANDATIONS
  // ============================================

  async getRecommendations() {
    const uid = this.getUserId();
    if (!uid) return [];
    return aiService.getRecommendations(uid);
  }

  // ============================================
  // EVENT HANDLERS (transmis par la View)
  // ============================================

  onRefresh() {
    this.loadDashboardData();
    this.view.showToast('Donnees actualisees', 'success');
  }

  onNavigateSettings() {
    this.view.showToast('Parametres — bientot disponible', 'info');
  }

  onViewProgressDetails() {
    this.view.showToast('Details de progression — bientot disponible', 'info');
  }

  onViewCalendar() {
    this.view.showToast('Calendrier — bientot disponible', 'info');
  }

  onPlanSession() {
    this.view.showToast('Planificateur — bientot disponible', 'info');
  }

  async onCompleteEvent(index) {
    const schedule = await this.getSchedule();
    if (schedule[index]) {
      schedule[index].completed = true;
      this.view.updateSchedule(schedule);
      this.view.showToast('Evenement marque comme termine', 'success');
    }
  }

  onViewAllActivities() {
    this.view.showToast('Historique complet — bientot disponible', 'info');
  }

  async onMarkAllNotificationsRead() {
    const notifications = await this.getNotifications();
    this.view.updateNotifications(notifications.map(n => ({ ...n, read: true })));
    this.view.showToast('Toutes les notifications sont lues', 'success');
  }

  onNotificationClick(index) {
    this.view.markNotificationRead(index);
  }

  onStartRecommendation(index) {
    this.view.showToast('Lancement de la recommandation...', 'info');
  }

  onStatCardClick(index) {
    const labels = ['Lecons', 'Heures', 'Scores', 'Serie'];
    this.view.showToast(`Details : ${labels[index] || 'Stat'}`, 'info');
  }

  // ============================================
  // DEFAULTS
  // ============================================

  _defaultStats() {
    return [
      { icon: '\ud83d\udcda', label: 'Lecons terminees', value: '0', change: 0, bgColor: '#e3f2fd' },
      { icon: '\u23f1\ufe0f', label: 'Heures d\'etude', value: '0h', change: 0, bgColor: '#f3e5f5' },
      { icon: '\ud83c\udfaf', label: 'Score moyen', value: '0%', change: 0, bgColor: '#e8f5e9' },
      { icon: '\ud83d\udd25', label: 'Serie actuelle', value: '0 jours', change: 0, bgColor: '#fff3e0' }
    ];
  }

  _defaultProgress() {
    return {
      currentLevel: 'A1',
      nextLevel: 'A2',
      percentage: 0,
      skills: []
    };
  }
}
