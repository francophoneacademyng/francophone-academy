/**
 * quiz.js — Page Quiz & Evaluations
 * Architecture : HTML -> View -> Controller -> AIService -> Service -> Repository -> Firestore
 */

import { AuthController } from '../../src/controllers/AuthController.js';
import { QuizController } from '../../src/controllers/QuizController.js';
import { CEFR_LEVELS } from '../../src/config/firebase.js';

// ============================================
// AUTH GUARD
// ============================================
if (!AuthController.isAuthenticated()) {
  window.location.href = '../login/login.html';
}

// ============================================
// CONTROLLER
// ============================================
const controller = new QuizController();

// ============================================
// DOM ELEMENTS
// ============================================
const container = document.getElementById('quiz-container');
const pageTitle = document.getElementById('page-title');
const user = AuthController.getCurrentUser();

if (user?.displayName) {
  document.getElementById('user-name').textContent = user.displayName;
}

// ============================================
// STATE
// ============================================
let state = {
  activeTab: 'quizzes',
  quizzes: [],
  stats: null,
  currentQuiz: null,
  currentQuestions: [],
  currentQuestionIndex: 0,
  answers: {},
  attemptId: null,
  timerInterval: null,
  timeRemaining: 0
};

// ============================================
// VIEW — Inline
// ============================================
const view = {
  renderLoading: (msg) => {
    container.innerHTML = `<div class="loading-state" style="padding:var(--space-8)"><div class="loading-spinner"></div><p>${msg}</p></div>`;
  },

  renderError: (msg) => {
    container.innerHTML = `<div class="error-state" style="padding:var(--space-8)"><div class="error-icon">&#9888;</div><p>${msg}</p></div>`;
  },

  showToast: (message, type = 'info', duration = 3000) => {
    const tc = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    tc.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => { toast.classList.remove('toast--visible'); setTimeout(() => toast.remove(), 300); }, duration);
  },

  // ========== CATALOGUE ==========
  renderCatalog: (quizzes, stats) => {
    pageTitle.textContent = 'Quiz & Evaluations';

    let html = '';

    // Stats
    if (stats && stats.totalQuizzes > 0) {
      html += `
        <div class="quiz-stats-summary">
          <div class="quiz-stat-card">
            <span class="quiz-stat-icon">&#127919;</span>
            <span class="quiz-stat-value ${stats.lastScore >= 60 ? 'quiz-stat-value--success' : stats.lastScore >= 40 ? 'quiz-stat-value--warning' : 'quiz-stat-value--danger'}">${stats.lastScore}%</span>
            <span class="quiz-stat-label">Dernier score</span>
          </div>
          <div class="quiz-stat-card">
            <span class="quiz-stat-icon">&#128200;</span>
            <span class="quiz-stat-value">${stats.averageScore}%</span>
            <span class="quiz-stat-label">Moyenne generale</span>
          </div>
          <div class="quiz-stat-card">
            <span class="quiz-stat-icon">&#128221;</span>
            <span class="quiz-stat-value">${stats.totalQuizzes}</span>
            <span class="quiz-stat-label">Quiz realises</span>
          </div>
          <div class="quiz-stat-card">
            <span class="quiz-stat-icon">&#127942;</span>
            <span class="quiz-stat-value ${stats.isLastPassing ? 'quiz-stat-value--success' : ''}">${stats.isLastPassing ? 'Reussi' : 'En cours'}</span>
            <span class="quiz-stat-label">Dernier quiz</span>
          </div>
        </div>`;
    }

    // Tabs
    html += `
      <div class="quiz-tabs">
        <button class="quiz-tab ${state.activeTab === 'quizzes' ? 'quiz-tab--active' : ''}" data-tab="quizzes">Quiz pratiques</button>
        <button class="quiz-tab ${state.activeTab === 'exams' ? 'quiz-tab--active' : ''}" data-tab="exams">Examens officiels</button>
        <button class="quiz-tab ${state.activeTab === 'results' ? 'quiz-tab--active' : ''}" data-tab="results">Mes resultats</button>
      </div>`;

    // Filters
    if (state.activeTab === 'quizzes') {
      html += `
        <div class="quiz-filters">
          <select class="form-select" id="filter-level" aria-label="Filtrer par niveau">
            <option value="">Tous les niveaux</option>
            <option value="A1">A1 — Debutant</option>
            <option value="A2">A2 — Elementaire</option>
            <option value="B1">B1 — Intermediaire</option>
            <option value="B2">B2 — Avance</option>
            <option value="C1">C1 — Autonome</option>
            <option value="C2">C2 — Maitrise</option>
          </select>
          <select class="form-select" id="filter-category" aria-label="Filtrer par categorie">
            <option value="">Toutes les categories</option>
            <option value="grammar">Grammaire</option>
            <option value="vocabulary">Vocabulaire</option>
            <option value="comprehension">Comprehension</option>
            <option value="general">General</option>
          </select>
        </div>`;
    }

    // Content
    if (state.activeTab === 'quizzes') {
      html += view._renderQuizzesList(quizzes);
    } else if (state.activeTab === 'exams') {
      html += view._renderExamsList(quizzes);
    } else if (state.activeTab === 'results') {
      html += view._renderResultsList(stats);
    }

    container.innerHTML = html;
    view._bindCatalogEvents();
  },

  _renderQuizzesList: (quizzes) => {
    const practiceQuizzes = quizzes.filter(q => q.examType === 'practice' || !q.examType);
    if (practiceQuizzes.length === 0) {
      return `<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">&#10067;</div><p>Aucun quiz disponible pour le moment.</p></div>`;
    }
    return `<div class="quiz-grid">${practiceQuizzes.map(q => view._renderQuizCard(q)).join('')}</div>`;
  },

  _renderExamsList: (quizzes) => {
    const examQuizzes = quizzes.filter(q => q.examType && q.examType !== 'practice');
    let html = `
      <div class="exam-types-grid">
        <div class="exam-type-card">
          <span class="exam-type-card__icon">&#128203;</span>
          <h3>DELF</h3>
          <p>Diplome d'Etudes en Langue Francaise</p>
        </div>
        <div class="exam-type-card">
          <span class="exam-type-card__icon">&#127891;</span>
          <h3>DALF</h3>
          <p>Diplome Approfondi de Langue Francaise</p>
        </div>
        <div class="exam-type-card">
          <span class="exam-type-card__icon">&#128221;</span>
          <h3>TCF</h3>
          <p>Test de Connaissance du Francais</p>
        </div>
        <div class="exam-type-card">
          <span class="exam-type-card__icon">&#128240;</span>
          <h3>TEF</h3>
          <p>Test d'Evaluation de Francais</p>
        </div>
      </div>`;

    if (examQuizzes.length === 0) {
      html += `<div class="empty-state" style="padding:var(--space-6)"><div class="empty-icon">&#128197;</div><p>Les simulations d'examens seront bientot disponibles.</p></div>`;
    } else {
      html += `<div class="quiz-grid">${examQuizzes.map(q => view._renderQuizCard(q)).join('')}</div>`;
    }
    return html;
  },

  _renderResultsList: (stats) => {
    if (!stats || !stats.recentQuizzes || stats.recentQuizzes.length === 0) {
      return `<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">&#128202;</div><p>Vous n'avez pas encore passe de quiz.</p><button class="btn btn--primary" style="margin-top:var(--space-3)" data-action="go-quizzes">Parcourir les quiz</button></div>`;
    }

    let html = `
      <div class="skill-breakdown">
        ${[
          { name: 'Grammaire', score: stats.grammarScore },
          { name: 'Vocabulaire', score: stats.vocabularyScore },
          { name: 'Comprehension orale', score: stats.listeningScore },
          { name: 'Expression orale', score: stats.speakingScore },
          { name: 'Expression ecrite', score: stats.writingScore },
          { name: 'Comprehension ecrite', score: stats.readingScore }
        ].filter(s => s.score > 0).map(s => `
          <div class="skill-item">
            <div class="skill-item__header">
              <span class="skill-item__name">${s.name}</span>
              <span class="skill-item__score">${s.score}%</span>
            </div>
            <div class="skill-item__bar">
              <div class="skill-item__fill skill-item__fill--${s.score >= 70 ? 'high' : s.score >= 40 ? 'medium' : 'low'}" style="width:${s.score}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="quiz-grid">`;

    stats.recentQuizzes.forEach(q => {
      html += `
        <div class="quiz-card">
          <div class="quiz-card__header">
            <span class="badge badge--${q.isPassing ? 'success' : 'error'}">${q.isPassing ? 'Reussi' : 'A revoir'}</span>
          </div>
          <h4 class="quiz-card__title">${q.quizTitle}</h4>
          <div class="quiz-card__score">
            <div class="progress-bar">
              <div class="progress-bar__fill" style="width:${q.score}%;background:${q.score >= 70 ? 'var(--success)' : q.score >= 50 ? 'var(--warning)' : 'var(--error)'})"></div>
            </div>
            <span class="quiz-card__score-text">${q.score}% — ${new Date(q.date).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>`;
    });

    html += '</div>';
    return html;
  },

  _renderQuizCard: (quiz) => {
    const levelColors = { A1: 'a1', A2: 'a2', B1: 'b1', B2: 'b2', C1: 'c1', C2: 'c2' };
    return `
      <div class="quiz-card" data-quiz-id="${quiz.id}">
        <div class="quiz-card__header">
          <span class="badge badge--${levelColors[quiz.level] || 'a1'}">${quiz.level}</span>
          <span class="quiz-card__category">${quiz.category || 'General'}</span>
        </div>
        <h3 class="quiz-card__title">${quiz.title}</h3>
        <p class="quiz-card__description">${quiz.description || ''}</p>
        <div class="quiz-card__meta">
          <span>&#10067; ${quiz.questionCount || 0} questions</span>
          <span>&#9201; ${quiz.duration || 0} min</span>
          <span>&#127919; ${quiz.examType || 'Pratique'}</span>
        </div>
        <button class="btn btn--primary btn--block" data-action="start-quiz" data-quiz-id="${quiz.id}">Commencer</button>
      </div>`;
  },

  _bindCatalogEvents: () => {
    // Tabs
    container.querySelectorAll('.quiz-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.activeTab = tab.dataset.tab;
        refreshCatalog();
      });
    });

    // Filters
    const filterLevel = document.getElementById('filter-level');
    const filterCategory = document.getElementById('filter-category');
    if (filterLevel) {
      filterLevel.addEventListener('change', () => applyFilters());
    }
    if (filterCategory) {
      filterCategory.addEventListener('change', () => applyFilters());
    }

    // Start quiz
    container.querySelectorAll('[data-action="start-quiz"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const quizId = e.currentTarget.dataset.quizId;
        controller.onStartQuiz(quizId);
      });
    });

    // Go to quizzes
    container.querySelectorAll('[data-action="go-quizzes"]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeTab = 'quizzes';
        refreshCatalog();
      });
    });
  },

  // ========== QUIZ TAKING ==========
  startQuiz: (quiz, questions, attempt) => {
    state.currentQuiz = quiz;
    state.currentQuestions = questions;
    state.currentQuestionIndex = 0;
    state.answers = {};
    state.attemptId = attempt.id;

    pageTitle.textContent = quiz.title;
    view._renderQuestion();
  },

  _renderQuestion: () => {
    const quiz = state.currentQuiz;
    const questions = state.currentQuestions;
    const idx = state.currentQuestionIndex;
    const question = questions[idx];
    const progress = ((idx + 1) / questions.length) * 100;
    const hasAnswer = state.answers[idx] !== undefined;

    let html = `
      <div class="quiz-taking">
        <div class="quiz-taking__header">
          <button class="btn btn--text btn--small" data-action="abandon">&#8592; Quitter</button>
          <span class="quiz-taking__progress-info">Question ${idx + 1} / ${questions.length}</span>
          ${quiz.duration ? `<span class="quiz-taking__timer" id="quiz-timer">&#9201; ${quiz.duration}:00</span>` : ''}
        </div>

        <div class="quiz-progress-track">
          <div class="quiz-progress-fill" style="width:${progress}%"></div>
        </div>

        <div class="quiz-question">
          <span class="quiz-question__number">Question ${idx + 1}</span>
          <h2 class="quiz-question__text">${question.text}</h2>
          ${question.context ? `<p class="quiz-question__context">${question.context}</p>` : ''}

          <div class="quiz-answers">
            ${view._renderAnswers(question, idx)}
          </div>
        </div>

        <div class="quiz-navigation">
          <button class="btn btn--outline" data-action="prev" ${idx === 0 ? 'disabled' : ''}>&#8592; Precedent</button>
          <div class="quiz-nav-dots">
            ${questions.map((_, i) => `
              <button class="quiz-nav-dot ${i === idx ? 'quiz-nav-dot--active' : ''} ${state.answers[i] !== undefined ? 'quiz-nav-dot--answered' : ''}"
                data-action="goto" data-index="${i}">${i + 1}</button>
            `).join('')}
          </div>
          ${idx < questions.length - 1
            ? `<button class="btn btn--primary" data-action="next">Suivant &#8594;</button>`
            : `<button class="btn btn--primary" data-action="submit">Terminer &#10003;</button>`
          }
        </div>
      </div>`;

    container.innerHTML = html;
    view._bindQuizEvents();
  },

  _renderAnswers: (question, qIdx) => {
    const savedAnswer = state.answers[qIdx];

    switch (question.type) {
      case 'multiple_choice':
        return question.options.map((opt, i) => `
          <label class="quiz-answer ${savedAnswer === i ? 'quiz-answer--selected' : ''}">
            <input type="radio" name="q${qIdx}" value="${i}" ${savedAnswer === i ? 'checked' : ''}>
            <span class="quiz-answer__letter">${String.fromCharCode(65 + i)}</span>
            <span class="quiz-answer__text">${opt.text}</span>
          </label>
        `).join('');

      case 'true_false':
        return ['true', 'false'].map((val, i) => `
          <label class="quiz-answer ${savedAnswer === (val === 'true') ? 'quiz-answer--selected' : ''}">
            <input type="radio" name="q${qIdx}" value="${val}" ${savedAnswer === (val === 'true') ? 'checked' : ''}>
            <span class="quiz-answer__text">${val === 'true' ? 'Vrai' : 'Faux'}</span>
          </label>
        `).join('');

      case 'fill_in_blank':
      case 'short_answer':
        return `<div class="quiz-answer--open">
          <textarea id="answer-${qIdx}" placeholder="Votre reponse..." rows="3">${savedAnswer || ''}</textarea>
        </div>`;

      case 'open_ended':
        return `<div class="quiz-answer--open">
          <textarea id="answer-${qIdx}" placeholder="Developpez votre reponse..." rows="6">${savedAnswer || ''}</textarea>
        </div>`;

      case 'ordering':
        return `<div class="quiz-ordering-list" id="ordering-${qIdx}">
          ${(question.options || question.correctOrder || []).map((item, i) => `
            <div class="quiz-ordering-item" draggable="true" data-value="${typeof item === 'object' ? item.text : item}" data-index="${i}">
              <span class="quiz-ordering-item__handle">&#9776;</span>
              <span class="quiz-ordering-item__text">${typeof item === 'object' ? item.text : item}</span>
            </div>
          `).join('')}
        </div>`;

      case 'matching':
        return `<div class="quiz-matching-grid" id="matching-${qIdx}">
          <div class="quiz-matching-left">
            ${question.pairs?.map((p, i) => `
              <div class="quiz-matching-item" data-left="${p.left}" data-index="${i}">${p.left}</div>
            `).join('') || ''}
          </div>
          <div class="quiz-matching-right">
            ${[...question.pairs].sort(() => Math.random() - 0.5).map((p, i) => `
              <div class="quiz-matching-item" data-right="${p.right}" data-index="${i}">${p.right}</div>
            `).join('') || ''}
          </div>
        </div>`;

      default:
        return `<div class="quiz-answer--open">
          <textarea id="answer-${qIdx}" placeholder="Votre reponse..." rows="3">${savedAnswer || ''}</textarea>
        </div>`;
    }
  },

  _bindQuizEvents: () => {
    // Prev / Next
    container.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
      view._saveCurrentAnswer();
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        view._renderQuestion();
      }
    });

    container.querySelector('[data-action="next"]')?.addEventListener('click', () => {
      view._saveCurrentAnswer();
      if (state.currentQuestionIndex < state.currentQuestions.length - 1) {
        state.currentQuestionIndex++;
        view._renderQuestion();
      }
    });

    container.querySelector('[data-action="submit"]')?.addEventListener('click', () => {
      view._saveCurrentAnswer();
      if (confirm('Voulez-vous soumettre vos reponses ?')) {
        controller.onSubmitQuiz();
      }
    });

    container.querySelector('[data-action="abandon"]')?.addEventListener('click', () => {
      if (confirm('Voulez-vous vraiment quitter ? Votre progression sera sauvegardee.')) {
        controller.onAbandonQuiz();
      }
    });

    // Navigation dots
    container.querySelectorAll('[data-action="goto"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        view._saveCurrentAnswer();
        state.currentQuestionIndex = parseInt(e.currentTarget.dataset.index);
        view._renderQuestion();
      });
    });

    // Radio answers
    container.querySelectorAll('input[type="radio"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const qIdx = state.currentQuestionIndex;
        let val = e.target.value;
        if (e.target.value === 'true') val = true;
        else if (e.target.value === 'false') val = false;
        else if (!isNaN(parseInt(e.target.value))) val = parseInt(e.target.value);
        state.answers[qIdx] = val;

        // Visual feedback
        e.target.closest('.quiz-answer').parentElement.querySelectorAll('.quiz-answer').forEach(el => el.classList.remove('quiz-answer--selected'));
        e.target.closest('.quiz-answer').classList.add('quiz-answer--selected');

        controller.onAnswer(qIdx, val);
      });
    });

    // Textarea answers
    container.querySelectorAll('.quiz-answer--open textarea').forEach(ta => {
      ta.addEventListener('blur', () => {
        const qIdx = state.currentQuestionIndex;
        state.answers[qIdx] = ta.value;
        controller.onAnswer(qIdx, ta.value);
      });
    });
  },

  _saveCurrentAnswer: () => {
    const qIdx = state.currentQuestionIndex;
    const question = state.currentQuestions[qIdx];

    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      const checked = container.querySelector(`input[name="q${qIdx}"]:checked`);
      if (checked) {
        let val = checked.value;
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(parseInt(val))) val = parseInt(val);
        state.answers[qIdx] = val;
      }
    } else {
      const ta = document.getElementById(`answer-${qIdx}`);
      if (ta) state.answers[qIdx] = ta.value;
    }
  },

  showQuestion: (index) => {
    view._saveCurrentAnswer();
    state.currentQuestionIndex = index;
    view._renderQuestion();
  },

  updateTimer: (remaining) => {
    const timerEl = document.getElementById('quiz-timer');
    if (!timerEl) return;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timerEl.innerHTML = `&#9201; ${m}:${s.toString().padStart(2, '0')}`;
    if (remaining < 60) timerEl.classList.add('quiz-taking__timer--warning');
  },

  // ========== RESULT ==========
  showResult: (result, feedback, recommendations, exercises) => {
    pageTitle.textContent = 'Resultat';

    const scoreClass = result.percentage >= 70 ? 'success' : result.percentage >= 50 ? 'average' : 'fail';
    const scoreLabel = result.percentage >= 80 ? 'Excellent !' : result.percentage >= 60 ? 'Bon travail !' : result.percentage >= 40 ? 'Continuez !' : 'A revoir';

    let html = `
      <div class="quiz-result">
        <div class="quiz-result__header">
          <h2 class="quiz-result__title">${result.quizTitle}</h2>
        </div>

        <div class="score-circle score-circle--${scoreClass}">
          <span class="score-circle__value">${result.percentage}%</span>
          <span class="score-circle__label">${scoreLabel}</span>
        </div>

        <div class="skill-breakdown" style="max-width:500px;margin:0 auto var(--space-6)">
          ${[
            { name: 'Grammaire', score: result.grammarScore },
            { name: 'Vocabulaire', score: result.vocabularyScore },
            { name: 'Comprehension', score: Math.max(result.listeningScore, result.readingScore) },
            { name: 'Expression', score: Math.max(result.speakingScore, result.writingScore) }
          ].filter(s => s.score > 0).map(s => `
            <div class="skill-item">
              <div class="skill-item__header">
                <span class="skill-item__name">${s.name}</span>
                <span class="skill-item__score">${s.score}%</span>
              </div>
              <div class="skill-item__bar"><div class="skill-item__fill skill-item__fill--${s.score >= 70 ? 'high' : s.score >= 40 ? 'medium' : 'low'}" style="width:${s.score}%"></div></div>
            </div>
          `).join('')}
        </div>`;

    // AI Feedback
    if (feedback) {
      html += `
        <div class="ai-feedback">
          <div class="ai-feedback__title">&#129302; Feedback personnalise</div>
          <div class="ai-feedback__content">${feedback.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</div>
          ${recommendations?.length ? `
            <div class="ai-feedback__recommendations">
              <h4>Recommandations</h4>
              <ul>${recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
            </div>
          ` : ''}
        </div>`;
    }

    // Question breakdown
    if (result.answers?.length > 0) {
      html += `
        <div class="quiz-result__breakdown">
          <h3>Detail des reponses</h3>
          ${result.answers.map((ans, i) => `
            <div class="result-question result-question--${ans.correct ? 'correct' : 'incorrect'}">
              <div class="result-question__header">
                <span class="result-question__number">Q${i + 1}</span>
                <span class="result-question__status">${ans.correct ? '&#9989;' : '&#10060;'}</span>
              </div>
              <p class="result-question__text">${ans.questionText}</p>
              ${!ans.correct ? `
                <div class="result-question__correction">
                  <p><strong>Votre reponse :</strong> ${ans.userAnswer ?? '-'}</p>
                  <p><strong>Bonne reponse :</strong> ${ans.correctAnswer ?? '-'}</p>
                  ${ans.explanation ? `<p><strong>Explication :</strong> ${ans.explanation}</p>` : ''}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>`;
    }

    // Remediation exercises
    if (exercises?.length > 0) {
      html += `
        <div class="remediation-exercises">
          <h3>Exercices de remediation</h3>
          ${exercises.map(ex => `
            <div class="remediation-card">
              <div class="remediation-card__title">${ex.title}</div>
              <div class="remediation-card__desc">${ex.description}</div>
              ${ex.skill ? `<span class="remediation-card__skill">${ex.skill}</span>` : ''}
            </div>
          `).join('')}
        </div>`;
    }

    // Actions
    html += `
        <div class="quiz-result__actions">
          <button class="btn btn--primary" data-action="retry">&#128260; Reessayer</button>
          <a href="../tutor/tutor.html" class="btn btn--outline">&#129302; Tuteur IA</a>
          <button class="btn btn--text" data-action="back">&#8592; Retour aux quiz</button>
        </div>
      </div>`;

    container.innerHTML = html;

    // Bind result events
    container.querySelector('[data-action="retry"]')?.addEventListener('click', () => controller.onRetryQuiz());
    container.querySelector('[data-action="back"]')?.addEventListener('click', () => controller.onBackToCatalog());
  },

  showCatalog: () => {
    state.currentQuiz = null;
    state.currentQuestions = [];
    refreshCatalog();
  }
};

// ============================================
// BINDINGS
// ============================================
controller.setView(view);

// Logout
document.getElementById('btn-logout')?.addEventListener('click', () => AuthController.logout());

// Mobile menu
document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
  document.getElementById('quiz-sidebar').classList.toggle('quiz-sidebar--open');
});

// ============================================
// HELPERS
// ============================================
async function refreshCatalog() {
  view.renderLoading('Chargement...');

  const userLevel = user?.level || 'A1';
  const [quizzes, stats] = await Promise.all([
    controller.loadCatalog(userLevel),
    state.activeTab === 'results' || state.activeTab === 'quizzes' ? controller.loadAssessmentStats() : Promise.resolve(null)
  ]);

  state.quizzes = quizzes;
  state.stats = stats;
  view.renderCatalog(quizzes, stats);
}

async function applyFilters() {
  const level = document.getElementById('filter-level')?.value || '';
  const category = document.getElementById('filter-category')?.value || '';
  const filters = {};
  if (level) filters.level = level;
  if (category) filters.category = category;

  view.renderLoading('Filtrage...');
  const filtered = await controller.filterQuizzes(filters);
  state.quizzes = filtered;
  view.renderCatalog(filtered, state.stats);
}

// ============================================
// INIT
// ============================================
refreshCatalog();
