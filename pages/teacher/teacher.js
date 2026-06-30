/**
 * teacher.js — Page Espace Enseignant
 */

import { AuthController } from '../../src/controllers/AuthController.js';
import { TeacherController } from '../../src/controllers/TeacherController.js';
import { QuizController } from '../../src/controllers/QuizController.js';
import { PaymentController } from '../../src/controllers/PaymentController.js';

// Auth Guard
if (!AuthController.isAuthenticated()) {
  window.location.href = '../login/login.html';
}

const user = AuthController.getCurrentUser();
if (user?.displayName) {
  document.getElementById('user-name').textContent = user.displayName;
}

// Controllers
const controller = new TeacherController();
const quizController = new QuizController();
const coursesContainer = document.getElementById('teacher-courses-list');
const quizzesContainer = document.getElementById('teacher-quizzes-list');

const view = {
  showToast: (message, type = 'info', duration = 3000) => {
    const tc = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    tc.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => { toast.classList.remove('toast--visible'); setTimeout(() => toast.remove(), 300); }, duration);
  },

  renderCourses: (courses) => {
    if (courses.length === 0) {
      coursesContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128221;</div><p>Aucun cours cree pour le moment.</p></div>';
      document.getElementById('stat-courses').textContent = '0';
      return;
    }
    document.getElementById('stat-courses').textContent = courses.length;
    document.getElementById('stat-published').textContent = courses.filter(c => c.status === 'published').length;

    coursesContainer.innerHTML = courses.map(course => `
      <div class="teacher-course-item" data-course-id="${course.id}">
        <div class="teacher-course__info">
          <div class="teacher-course__title">${course.title}</div>
          <div class="teacher-course__meta">
            <span class="badge badge--${course.level?.toLowerCase()}">${course.level}</span>
            <span>${course.getCategoryLabel ? course.getCategoryLabel() : course.category}</span>
            <span>${course.status === 'published' ? '&#127775; Publie' : course.status === 'archived' ? '&#128451; Archive' : '&#9997; Brouillon'}</span>
          </div>
        </div>
        <div class="teacher-course__actions">
          ${course.status !== 'published' ? `<button class="btn btn--primary btn--small" data-action="publish" data-course-id="${course.id}">Publier</button>` : ''}
          ${course.status !== 'archived' ? `<button class="btn btn--outline btn--small" data-action="archive" data-course-id="${course.id}">Archiver</button>` : ''}
        </div>
      </div>
    `).join('');

    coursesContainer.querySelectorAll('[data-action="publish"]').forEach(btn => {
      btn.addEventListener('click', (e) => controller.onPublishCourse(e.currentTarget.dataset.courseId));
    });
    coursesContainer.querySelectorAll('[data-action="archive"]').forEach(btn => {
      btn.addEventListener('click', (e) => controller.onArchiveCourse(e.currentTarget.dataset.courseId));
    });
  },

  renderQuizzes: (quizzes) => {
    if (!quizzesContainer) return;
    if (quizzes.length === 0) {
      quizzesContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">&#10067;</div><p>Aucun quiz cree pour le moment.</p></div>';
      document.getElementById('stat-quizzes').textContent = '0';
      return;
    }
    document.getElementById('stat-quizzes').textContent = quizzes.length;
    document.getElementById('stat-published').textContent = quizzes.filter(q => q.isPublished).length;

    quizzesContainer.innerHTML = quizzes.map(quiz => `
      <div class="teacher-course-item" data-quiz-id="${quiz.id}">
        <div class="teacher-course__info">
          <div class="teacher-course__title">${quiz.title}</div>
          <div class="teacher-course__meta">
            <span class="badge badge--${quiz.level?.toLowerCase()}">${quiz.level}</span>
            <span>${quiz.category || 'General'}</span>
            <span>${quiz.questionCount || 0} questions</span>
            <span>${quiz.isPublished ? '&#127775; Publie' : quiz.isArchived ? '&#128451; Archive' : '&#9997; Brouillon'}</span>
          </div>
        </div>
        <div class="teacher-course__actions">
          ${!quiz.isPublished && !quiz.isArchived ? `<button class="btn btn--primary btn--small" data-action="publish-quiz" data-quiz-id="${quiz.id}">Publier</button>` : ''}
          ${!quiz.isArchived ? `<button class="btn btn--outline btn--small" data-action="archive-quiz" data-quiz-id="${quiz.id}">Archiver</button>` : ''}
        </div>
      </div>
    `).join('');

    quizzesContainer.querySelectorAll('[data-action="publish-quiz"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const result = await quizController.loadAssessmentStats();
        // Use aiService directly through controller pattern
        const { aiService } = await import('../../src/services/AIService.js');
        await aiService.publishQuiz(e.currentTarget.dataset.quizId);
        view.showToast('Quiz publie', 'success');
        loadTeacherQuizzes();
      });
    });
    quizzesContainer.querySelectorAll('[data-action="archive-quiz"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const { aiService } = await import('../../src/services/AIService.js');
        await aiService.archiveQuiz(e.currentTarget.dataset.quizId);
        view.showToast('Quiz archive', 'info');
        loadTeacherQuizzes();
      });
    });
  }
};

controller.setView(view);
quizController.setView(view);

// Create course form
document.getElementById('create-course-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  data.objectives = (data.objectives || '').split('\n').filter(o => o.trim());
  data.duration = parseInt(data.duration) || 1200;
  data.price = parseInt(data.price) || 0;
  data.moduleCount = 0;
  data.lessonCount = 0;
  data.quizCount = 0;

  const btn = document.getElementById('btn-create-course');
  btn.disabled = true;
  btn.classList.add('btn--loading');

  await controller.onCreateCourse(data);

  btn.disabled = false;
  btn.classList.remove('btn--loading');
  e.target.reset();
});

// Mobile sidebar
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
  sidebar.classList.add('sidebar--open');
  overlay.classList.add('sidebar-overlay--visible');
});
overlay?.addEventListener('click', () => {
  sidebar.classList.remove('sidebar--open');
  overlay.classList.remove('sidebar-overlay--visible');
});

// Logout
document.getElementById('btn-logout')?.addEventListener('click', () => AuthController.logout());

// Load quiz stats
async function loadTeacherQuizStats() {
  try {
    const { aiService } = await import('../../src/services/AIService.js');
    const stats = await aiService.getTeacherQuizStats(user?.uid);
    document.getElementById('stat-quizzes').textContent = stats.totalQuizzes || 0;
    document.getElementById('stat-questions').textContent = stats.totalQuestions || 0;
  } catch (e) { /* ignore */ }
}
loadTeacherQuizStats();

// Load financial stats
async function loadFinancialStats() {
  try {
    const paymentController = new PaymentController();
    const stats = await paymentController.loadFinancialStats();
    if (!stats) return;

    // Add financial section if not exists
    const mainContent = document.querySelector('.teacher-main');
    if (!mainContent) return;

    const existingFin = document.getElementById('teacher-financials');
    if (existingFin) existingFin.remove();

    const finSection = document.createElement('section');
    finSection.className = 'teacher-section';
    finSection.id = 'teacher-financials';
    finSection.innerHTML = `
      <h2 class="teacher-section__title">&#128176; Finances</h2>
      <div class="teacher-stats" style="margin-bottom:var(--space-4)">
        <div class="teacher-stat-card"><span class="teacher-stat__value">${stats.totalRevenue.toLocaleString('fr-FR')}</span><span class="teacher-stat__label">Revenus totaux (XOF)</span></div>
        <div class="teacher-stat-card"><span class="teacher-stat__value">${stats.monthlyRevenue.toLocaleString('fr-FR')}</span><span class="teacher-stat__label">Ce mois (XOF)</span></div>
        <div class="teacher-stat-card"><span class="teacher-stat__value">${stats.totalPayments}</span><span class="teacher-stat__label">Transactions</span></div>
        <div class="teacher-stat-card"><span class="teacher-stat__value">${stats.averageOrder.toLocaleString('fr-FR')}</span><span class="teacher-stat__label">Panier moyen</span></div>
      </div>
      ${stats.recentTransactions?.length > 0 ? `
        <h4 style="font-size:0.875rem;font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-3)">Transactions recentes</h4>
        <div class="teacher-list">
          ${stats.recentTransactions.slice(0, 5).map(t => `
            <div class="teacher-course-item">
              <div class="teacher-course__info">
                <div class="teacher-course__title">${t.plan} — ${t.amount.toLocaleString('fr-FR')} ${t.currency}</div>
                <div class="teacher-course__meta">
                  <span>${t.date ? new Date(t.date).toLocaleDateString('fr-FR') : ''}</span>
                  <span class="badge badge--success">${t.status}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<p style="color:var(--text-muted);font-size:0.875rem">Aucune transaction pour le moment.</p>'}
    `;

    // Insert before first section
    const firstSection = mainContent.querySelector('.teacher-section');
    if (firstSection) mainContent.insertBefore(finSection, firstSection);
    else mainContent.appendChild(finSection);

  } catch (e) { /* ignore */ }
}
loadFinancialStats();

// Load teacher quizzes
async function loadTeacherQuizzes() {
  try {
    const { aiService } = await import('../../src/services/AIService.js');
    const quizzes = await aiService.getTeacherQuizzes(user?.uid);
    view.renderQuizzes(quizzes);
  } catch (e) {
    if (quizzesContainer) quizzesContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">&#10067;</div><p>Erreur de chargement.</p></div>';
  }
}
loadTeacherQuizzes();

// Create quiz form
document.getElementById('create-quiz-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  data.duration = parseInt(data.duration) || 15;
  data.passingScore = parseInt(data.passingScore) || 60;
  data.maxAttempts = parseInt(data.maxAttempts) || 3;
  data.createdBy = user?.uid;

  const btn = document.getElementById('btn-create-quiz');
  btn.disabled = true;

  try {
    const { aiService } = await import('../../src/services/AIService.js');
    const { quiz, error } = await aiService.createQuiz(data);
    if (error) { view.showToast(error, 'error'); }
    else { view.showToast('Quiz cree avec succes', 'success'); e.target.reset(); loadTeacherQuizzes(); loadTeacherQuizStats(); }
  } catch (err) { view.showToast('Erreur lors de la creation', 'error'); }

  btn.disabled = false;
});

// Create question form
document.getElementById('create-question-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  data.points = parseInt(data.points) || 1;
  data.createdBy = user?.uid;

  // Build options for QCM
  if (data.type === 'multiple_choice') {
    const options = [];
    for (let i = 0; i < 4; i++) {
      const optText = data[`option${i}`];
      if (optText) {
        options.push({ text: optText, isCorrect: data.correctOption === String(i) });
      }
    }
    data.options = options;
    // Clean up
    for (let i = 0; i < 4; i++) delete data[`option${i}`];
    delete data.correctOption;
  }

  // Build accepted answers
  if (data.acceptedAnswers) {
    data.acceptedAnswers = data.acceptedAnswers.split('\n').filter(a => a.trim());
  }

  const btn = document.getElementById('btn-create-question');
  btn.disabled = true;

  try {
    const { aiService } = await import('../../src/services/AIService.js');
    const { question, error } = await aiService.createQuestion(data);
    if (error) { view.showToast(error, 'error'); }
    else { view.showToast('Question ajoutee a la banque', 'success'); e.target.reset(); loadTeacherQuizStats(); }
  } catch (err) { view.showToast('Erreur lors de l\'ajout', 'error'); }

  btn.disabled = false;
});

// Toggle question form fields based on type
document.getElementById('question-type')?.addEventListener('change', (e) => {
  const type = e.target.value;
  const qcmGroup = document.getElementById('qcm-options');
  const answersGroup = document.getElementById('accepted-answers-group');
  if (qcmGroup) qcmGroup.style.display = type === 'multiple_choice' ? 'block' : 'none';
  if (answersGroup) answersGroup.display = (type === 'fill_in_blank' || type === 'short_answer') ? 'block' : 'none';
});

// Load
controller.loadTeacherCourses();
