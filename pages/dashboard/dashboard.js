/**
 * dashboard.js — Page Dashboard
 * Instancie DashboardView + DashboardController avec donnees Firestore reelles.
 * Architecture : HTML -> View -> Controller -> AIService -> Service -> Repository -> Firestore
 */

import { DashboardView } from '../../src/views/DashboardView.js';
import { DashboardController } from '../../src/controllers/DashboardController.js';
import { CourseController } from '../../src/controllers/CourseController.js';
import { TutorController } from '../../src/controllers/TutorController.js';
import { QuizController } from '../../src/controllers/QuizController.js';
import { PaymentController } from '../../src/controllers/PaymentController.js';
import { CertificateController } from '../../src/controllers/CertificateController.js';
import { AuthController } from '../../src/controllers/AuthController.js';

// ============================================
// AUTH GUARD
// ============================================
if (!AuthController.isAuthenticated()) {
  window.location.href = '../login/login.html';
}

// ============================================
// DOM Elements
// ============================================
const container = document.getElementById('dashboard-container');
const user = AuthController.getCurrentUser();

// Afficher le nom de l'utilisateur
if (user?.displayName) {
  document.getElementById('user-name').textContent = user.displayName;
}

// ============================================
// Welcome banner
// ============================================
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon apres-midi' : 'Bonsoir';
const firstName = user?.displayName?.split(' ')[0] || 'Apprenant';
const welcomeBanner = document.createElement('div');
welcomeBanner.className = 'dashboard-welcome';
welcomeBanner.innerHTML = `
  <div>
    <div class="dashboard-welcome__title">${greeting}, ${firstName} &#128075;</div>
    <div class="dashboard-welcome__subtitle">Pret(e) a progresser aujourd'hui ?</div>
  </div>
  <div class="dashboard-welcome__actions">
    <a href="../courses/courses.html" class="btn btn--white">&#128218; Mes cours</a>
    <a href="../tutor/tutor.html" class="btn btn--ghost">&#129302; Tuteur IA</a>
  </div>
`;
const dashboardContainer = document.querySelector('.dashboard-container');
if (dashboardContainer) dashboardContainer.insertBefore(welcomeBanner, dashboardContainer.firstChild);

// ============================================
// Controller + View
// ============================================
const controller = new DashboardController();
const view = new DashboardView({
  viewName: 'DashboardPage',
  container: container,
  controller: controller
});
controller.setView(view);

// ============================================
// Charger les donnees reelles depuis Firestore
// ============================================
controller.loadDashboardData();

// ============================================
// Charger "Activite IA Tutor"
// ============================================
const tutorController = new TutorController();
async function loadAITutorActivity() {
  const aiSection = document.getElementById('ai-tutor-section');
  if (!aiSection) return;

  try {
    const [memoryStats, sessions] = await Promise.all([
      tutorController.loadTutorStats(),
      tutorController.loadRecentSessions()
    ]);

    if (!memoryStats || memoryStats.totalMessages === 0) {
      aiSection.innerHTML = `
        <div class="empty-state" style="padding:var(--space-8)">
          <div class="empty-icon">&#129302;</div>
          <p>Vous n'avez pas encore utilise le tuteur IA.</p>
          <a href="../tutor/tutor.html" class="btn btn--tutor" style="margin-top:var(--space-3)">Demarrer une conversation</a>
        </div>`;
      return;
    }

    const statsCards = `
      <div class="ai-stats-grid">
        <div class="ai-stat-card">
          <span class="ai-stat-icon">&#128172;</span>
          <span class="ai-stat-value">${memoryStats.totalMessages || 0}</span>
          <span class="ai-stat-label">Messages echanges</span>
        </div>
        <div class="ai-stat-card">
          <span class="ai-stat-icon">&#127919;</span>
          <span class="ai-stat-value">${memoryStats.exercisesGenerated || 0}</span>
          <span class="ai-stat-label">Exercices generes</span>
        </div>
        <div class="ai-stat-card">
          <span class="ai-stat-icon">&#128295;</span>
          <span class="ai-stat-value">${memoryStats.correctionsMade || 0}</span>
          <span class="ai-stat-label">Corrections</span>
        </div>
        <div class="ai-stat-card">
          <span class="ai-stat-icon">&#128218;</span>
          <span class="ai-stat-value">${(memoryStats.learnedVocabulary || []).length}</span>
          <span class="ai-stat-label">Mots appris</span>
        </div>
      </div>
    `;

    const recentSessions = sessions.length > 0 ? `
      <div class="ai-sessions-list">
        <h4 class="ai-sessions-title">Conversations recentes</h4>
        ${sessions.slice(0, 3).map(s => `
          <a href="../tutor/tutor.html?course=${s.courseId || ''}&lesson=${s.lessonId || ''}&lessonTitle=${encodeURIComponent(s.lessonTitle || '')}" class="ai-session-item">
            <span class="ai-session-icon">&#128172;</span>
            <div class="ai-session-info">
              <span class="ai-session-topic">${s.lessonTitle || 'Discussion libre'}</span>
              <span class="ai-session-date">${s.lastMessageAt ? new Date(s.lastMessageAt).toLocaleDateString('fr-FR') : 'Recent'}</span>
            </div>
            <span class="ai-session-arrow">&rarr;</span>
          </a>
        `).join('')}
      </div>
    ` : '';

    aiSection.innerHTML = statsCards + recentSessions;

  } catch (err) {
    console.error('[Dashboard] Erreur chargement activite IA:', err);
    aiSection.innerHTML = `
      <div class="empty-state" style="padding:var(--space-8)">
        <div class="empty-icon">&#129302;</div>
        <p>Impossible de charger l'activite IA.</p>
        <a href="../tutor/tutor.html" class="btn btn--tutor" style="margin-top:var(--space-3)">Ouvrir le tuteur IA</a>
      </div>`;
  }
}
loadAITutorActivity();

// ============================================
// Charger "Mes Certificats"
// ============================================
const certificateController = new CertificateController();
async function loadMyCertificates() {
  const section = document.getElementById('my-certificates-section');
  if (!section) return;

  try {
    const certs = await certificateController.loadUserCertificates();
    if (!certs || certs.length === 0) {
      section.innerHTML = `
        <div class="empty-state" style="padding:var(--space-6)">
          <div class="empty-icon">&#127942;</div>
          <p>Aucun certificat pour le moment.</p>
          <p style="font-size:0.8125rem;color:var(--text-muted)">Completez un cours pour obtenir votre premier certificat.</p>
        </div>`;
      return;
    }

    section.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-3)">
        ${certs.slice(0, 3).map(c => `
          <div class="ai-stat-card" style="text-align:left">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2)">
              <span class="badge badge--${c.cefrLevel.toLowerCase()}">${c.cefrLevel}</span>
              <span style="font-size:0.75rem;color:var(--text-muted)">${c.isValid ? '&#9989; Valide' : '&#10060; Invalide'}</span>
            </div>
            <h4 style="font-size:0.9375rem;font-weight:600;margin-bottom:var(--space-1)">${c.courseTitle}</h4>
            <p style="font-size:0.75rem;color:var(--text-muted);font-family:monospace">${c.certificateNumber}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-2)">
              <span style="font-size:1.25rem;font-weight:700;color:var(--primary)">${c.score}%</span>
              <span style="font-size:0.75rem;color:var(--text-muted)">${c.grade}</span>
            </div>
          </div>
        `).join('')}
      </div>
      ${certs.length > 3 ? `<p style="font-size:0.8125rem;color:var(--text-muted);margin-top:var(--space-2)">Et ${certs.length - 3} autres certificats</p>` : ''}
    `;
  } catch (err) {
    console.error('[Dashboard] Erreur certificats:', err);
    section.innerHTML = '<p style="color:var(--text-muted);padding:var(--space-4)">Impossible de charger vos certificats.</p>';
  }
}
loadMyCertificates();

// ============================================
// Charger "Mon Abonnement"
// ============================================
const paymentController = new PaymentController();
async function loadMySubscription() {
  const section = document.getElementById('my-subscription-section');
  if (!section) return;

  try {
    const stats = await paymentController.loadSubscriptionStats();
    if (!stats) {
      section.innerHTML = '<div class="empty-state" style="padding:var(--space-6)"><p>Impossible de charger votre abonnement.</p></div>';
      return;
    }

    const daysText = stats.daysRemaining > 0
      ? `${stats.daysRemaining} jours restants`
      : stats.daysRemaining === -1 ? 'Illimite' : 'Expire';

    section.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--space-4);margin-bottom:var(--space-4)">
        <div class="ai-stat-card">
          <span class="ai-stat-icon">&#127775;</span>
          <span class="ai-stat-value">${stats.planName}</span>
          <span class="ai-stat-label">Plan actuel</span>
        </div>
        <div class="ai-stat-card">
          <span class="ai-stat-icon">&#9201;</span>
          <span class="ai-stat-value">${daysText}</span>
          <span class="ai-stat-label">Validite</span>
        </div>
        <div class="ai-stat-card">
          <span class="ai-stat-icon">&#128178;</span>
          <span class="ai-stat-value">${stats.totalPaid.toLocaleString('fr-FR')} ${stats.currency}</span>
          <span class="ai-stat-label">Total paye</span>
        </div>
        <div class="ai-stat-card">
          <span class="ai-stat-icon">&#128221;</span>
          <span class="ai-stat-value">${stats.paymentCount}</span>
          <span class="ai-stat-label">Paiements</span>
        </div>
      </div>
      ${stats.invoices?.length > 0 ? `
        <div style="margin-top:var(--space-3)">
          <p style="font-size:0.8125rem;color:var(--text-secondary);margin-bottom:var(--space-2)">Derniere facture : <strong>${stats.invoices[0].invoiceNumber}</strong> — ${stats.invoices[0].total.toLocaleString('fr-FR')} ${stats.invoices[0].currency}</p>
        </div>
      ` : ''}
    `;
  } catch (err) {
    console.error('[Dashboard] Erreur chargement abonnement:', err);
    section.innerHTML = '<div class="empty-state" style="padding:var(--space-6)"><p>Impossible de charger votre abonnement.</p></div>';
  }
}
loadMySubscription();

// ============================================
// Charger "Mes Evaluations"
// ============================================
const quizController = new QuizController();
async function loadMyAssessments() {
  const section = document.getElementById('my-assessments-section');
  if (!section) return;

  try {
    const stats = await quizController.loadAssessmentStats();
    if (!stats || stats.totalQuizzes === 0) {
      section.innerHTML = `
        <div class="empty-state" style="padding:var(--space-8)">
          <div class="empty-icon">&#10067;</div>
          <p>Vous n'avez pas encore passe de quiz.</p>
          <a href="../quiz/quiz.html" class="btn btn--primary" style="margin-top:var(--space-3)">Decouvrir les quiz</a>
        </div>`;
      return;
    }

    const scoreClass = stats.lastScore >= 70 ? 'quiz-stat-value--success' : stats.lastScore >= 50 ? 'quiz-stat-value--warning' : 'quiz-stat-value--danger';

    section.innerHTML = `
      <div class="quiz-stats-summary" style="margin-bottom:0">
        <div class="quiz-stat-card">
          <span class="quiz-stat-icon">&#127919;</span>
          <span class="quiz-stat-value ${scoreClass}">${stats.lastScore}%</span>
          <span class="quiz-stat-label">Dernier score</span>
        </div>
        <div class="quiz-stat-card">
          <span class="quiz-stat-icon">&#128200;</span>
          <span class="quiz-stat-value">${stats.averageScore}%</span>
          <span class="quiz-stat-label">Moyenne</span>
        </div>
        <div class="quiz-stat-card">
          <span class="quiz-stat-icon">&#128221;</span>
          <span class="quiz-stat-value">${stats.totalQuizzes}</span>
          <span class="quiz-stat-label">Quiz realises</span>
        </div>
        <div class="quiz-stat-card">
          <span class="quiz-stat-icon">&#128295;</span>
          <span class="quiz-stat-value">${stats.skillsToImprove.length}</span>
          <span class="quiz-stat-label">A retravailler</span>
        </div>
      </div>
      ${stats.skillsToImprove.length > 0 ? `
        <div style="margin-top:var(--space-4);padding:var(--space-3) var(--space-4);background:var(--warning-bg);border-radius:var(--radius);border:1px solid var(--warning)">
          <p style="font-size:0.875rem;color:var(--text-primary)"><strong>&#128161; Conseil :</strong> Travaillez vos competences en ${stats.skillsToImprove.slice(0, 3).join(', ')} pour progresser.</p>
        </div>
      ` : ''}
    `;
  } catch (err) {
    console.error('[Dashboard] Erreur chargement evaluations:', err);
    section.innerHTML = `
      <div class="empty-state" style="padding:var(--space-8)">
        <div class="empty-icon">&#10067;</div>
        <p>Impossible de charger vos evaluations.</p>
        <a href="../quiz/quiz.html" class="btn btn--primary" style="margin-top:var(--space-3)">Voir les quiz</a>
      </div>`;
  }
}
loadMyAssessments();

// ============================================
// Charger "Mes Cours"
// ============================================
const courseController = new CourseController();
async function loadMyCourses() {
  const myCoursesSection = document.getElementById('my-courses-section');
  if (!myCoursesSection) return;
  const userCourses = await courseController.loadUserCourses();
  if (userCourses.length === 0) {
    myCoursesSection.innerHTML = `<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">&#128218;</div><p>Vous n\'avez pas encore de cours.</p><a href="../courses/courses.html" class="btn btn--primary" style="margin-top:var(--space-3)">Parcourir le catalogue</a></div>`;
    return;
  }
  myCoursesSection.innerHTML = userCourses.map(uc => `
    <div class="my-course-card" data-course-id="${uc.course.id}">
      <div class="my-course__info">
        <h4 class="my-course__title">${uc.course.title}</h4>
        <div class="my-course__meta">
          <span class="badge badge--${uc.course.level?.toLowerCase()}">${uc.course.level}</span>
          <span>${uc.course.moduleCount || 0} modules</span>
        </div>
      </div>
      <div class="my-course__progress">
        <div class="progress-bar"><div class="progress-bar__fill" style="width:${uc.enrollment.progress || 0}%"></div></div>
        <span>${uc.enrollment.progress || 0}%</span>
      </div>
      <a href="../lesson/lesson.html?course=${uc.course.id}" class="btn btn--primary btn--small">Continuer</a>
    </div>
  `).join('');
}
loadMyCourses();

// ============================================
// Sidebar
// ============================================
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');

sidebarToggle?.addEventListener('click', () => {
  sidebar.classList.toggle('sidebar--collapsed');
  const isCollapsed = sidebar.classList.contains('sidebar--collapsed');
  sidebarToggle.setAttribute('aria-expanded', String(!isCollapsed));
});

function openMobileMenu() {
  sidebar.classList.add('sidebar--open');
  sidebarOverlay.classList.add('sidebar-overlay--visible');
}

function closeMobileMenu() {
  sidebar.classList.remove('sidebar--open');
  sidebarOverlay.classList.remove('sidebar-overlay--visible');
}

mobileMenuToggle?.addEventListener('click', openMobileMenu);
sidebarOverlay?.addEventListener('click', closeMobileMenu);

// Fermer sidebar au clic sur un lien (mobile)
document.querySelectorAll('.sidebar__link').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 1024) closeMobileMenu();
  });
});

// ============================================
// User Menu Dropdown
// ============================================
const userMenuTrigger = document.getElementById('user-menu-trigger');
const userDropdown = document.getElementById('user-dropdown');

userMenuTrigger?.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = !userDropdown.hidden;
  userDropdown.hidden = isOpen;
  userMenuTrigger.setAttribute('aria-expanded', String(!isOpen));
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu') && userDropdown) {
    userDropdown.hidden = true;
    userMenuTrigger?.setAttribute('aria-expanded', 'false');
  }
});

// ============================================
// Logout
// ============================================
function handleLogout() {
  AuthController.logout();
}
document.getElementById('btn-logout')?.addEventListener('click', handleLogout);
document.getElementById('btn-logout-dropdown')?.addEventListener('click', handleLogout);

// ============================================
// Notifications
// ============================================
document.getElementById('btn-notifications')?.addEventListener('click', () => {
  view.showToast('Centre de notifications — bientot disponible', 'info');
});

// ============================================
// Responsive
// ============================================
window.addEventListener('resize', () => {
  if (window.innerWidth > 1024) closeMobileMenu();
});
