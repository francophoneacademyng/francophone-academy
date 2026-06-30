/**
 * AssessmentView.js
 * View pour les évaluations : Quiz, Examens, Résultats, Certificats, Progression.
 *
 * Événements capturés → transmis au AssessmentController.
 */

import { BaseView } from './BaseView.js';

/**
 * @class AssessmentView
 * @extends BaseView
 * Gère l'affichage des quiz, examens, résultats et certificats.
 */
export class AssessmentView extends BaseView {
  constructor(options = {}) {
    super({
      viewName: 'AssessmentView',
      ...options
    });

    this.activeTab = 'quizzes'; // 'quizzes' | 'exams' | 'results' | 'certificates'
    this.currentQuiz = null;
    this.currentQuestion = 0;
    this.answers = {};
    this.timeRemaining = 0;
    this.timerInterval = null;
  }

  // ============================================================
  // Rendu principal
  // ============================================================

  /**
   * Rend l'interface d'évaluation.
   * @returns {HTMLElement}
   */
  render() {
    this.clear();

    const wrapper = this.createElement('div', {
      classNames: ['assessment-view'],
      attributes: { 'data-assessment-view': '' }
    });

    // En-tête avec onglets
    wrapper.appendChild(this._renderHeader());

    // Contenu selon l'onglet
    const content = this.createElement('div', {
      classNames: ['assessment-content'],
      attributes: { 'data-active-tab': this.activeTab }
    });

    switch (this.activeTab) {
      case 'quizzes':
        content.appendChild(this._renderQuizzesTab());
        break;
      case 'exams':
        content.appendChild(this._renderExamsTab());
        break;
      case 'results':
        content.appendChild(this._renderResultsTab());
        break;
      case 'certificates':
        content.appendChild(this._renderCertificatesTab());
        break;
      case 'quiz-taking':
        content.appendChild(this._renderQuizTaking());
        break;
      case 'quiz-result':
        content.appendChild(this._renderQuizResult());
        break;
    }

    wrapper.appendChild(content);
    this.container.appendChild(wrapper);
    return this.container;
  }

  // ============================================================
  // En-tête avec navigation
  // ============================================================

  /**
   * Rend l'en-tête avec les onglets de navigation.
   * @returns {HTMLElement}
   * @private
   */
  _renderHeader() {
    const tabs = [
      { id: 'quizzes', label: 'Quiz', icon: '❓', count: null },
      { id: 'exams', label: 'Examens', icon: '📝', count: null },
      { id: 'results', label: 'Résultats', icon: '📊', count: null },
      { id: 'certificates', label: 'Certificats', icon: '🏆', count: null }
    ];

    return this.createElement('header', {
      classNames: ['assessment-header'],
      innerHTML: `
        <h1 class="assessment-title">Évaluations</h1>
        <nav class="assessment-tabs" role="tablist" aria-label="Navigation des évaluations">
          ${tabs.map(tab => `
            <button 
              class="assessment-tab ${this.activeTab === tab.id ? 'assessment-tab--active' : ''}"
              role="tab"
              aria-selected="${this.activeTab === tab.id ? 'true' : 'false'}"
              data-tab="${tab.id}"
            >
              <span aria-hidden="true">${tab.icon}</span>
              <span>${tab.label}</span>
              ${tab.count !== null ? `<span class="tab-count">${tab.count}</span>` : ''}
            </button>
          `).join('')}
        </nav>
      `
    });
  }

  // ============================================================
  // Onglet: Quiz
  // ============================================================

  /**
   * Rend la liste des quiz disponibles.
   * @returns {HTMLElement}
   * @private
   */
  _renderQuizzesTab() {
    const quizzes = this.controller?.getAvailableQuizzes?.() || [];

    const section = this.createElement('section', {
      classNames: ['assessment-section', 'quizzes-section'],
      attributes: { 'aria-labelledby': 'quizzes-title' }
    });

    section.innerHTML = `
      <div class="section-toolbar">
        <h2 id="quizzes-title" class="section-title">Quiz disponibles</h2>
        <div class="section-filters">
          <select class="form-select" data-filter="quiz-level" aria-label="Filtrer par niveau">
            <option value="">Tous les niveaux</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
          </select>
          <select class="form-select" data-filter="quiz-category" aria-label="Filtrer par catégorie">
            <option value="">Toutes les catégories</option>
            <option value="grammar">Grammaire</option>
            <option value="vocabulary">Vocabulaire</option>
            <option value="comprehension">Compréhension</option>
            <option value="culture">Culture</option>
          </select>
        </div>
      </div>

      ${quizzes.length === 0
        ? this._renderEmptyState('Aucun quiz disponible pour le moment', '❓')
        : `
          <div class="quiz-grid">
            ${quizzes.map((quiz, index) => `
              <article class="quiz-card" data-quiz-index="${index}">
                <div class="quiz-card__header">
                  <span class="quiz-card__level badge badge--${quiz.level?.toLowerCase()}">${quiz.level}</span>
                  <span class="quiz-card__category">${this._escapeHtml(quiz.category)}</span>
                </div>
                <h3 class="quiz-card__title">${this._escapeHtml(quiz.title)}</h3>
                <p class="quiz-card__description">${this._escapeHtml(quiz.description)}</p>
                <div class="quiz-card__meta">
                  <span class="quiz-meta-item">
                    <span aria-hidden="true">❓</span> ${quiz.questionCount || 0} questions
                  </span>
                  <span class="quiz-meta-item">
                    <span aria-hidden="true">⏱️</span> ${quiz.duration || 0} min
                  </span>
                  <span class="quiz-meta-item">
                    <span aria-hidden="true">🔄</span> Tentatives: ${quiz.attempts || 0}/${quiz.maxAttempts || 1}
                  </span>
                </div>
                ${quiz.bestScore !== undefined ? `
                  <div class="quiz-card__score">
                    <div class="score-bar">
                      <div class="score-bar__fill" style="width: ${quiz.bestScore}%; background-color: ${quiz.bestScore >= 70 ? '#27ae60' : quiz.bestScore >= 50 ? '#f39c12' : '#e74c3c'}"></div>
                    </div>
                    <span>Meilleur score: ${quiz.bestScore}%</span>
                  </div>
                ` : ''}
                <button 
                  class="btn btn--primary btn--block ${quiz.attempts >= quiz.maxAttempts ? 'btn--disabled' : ''}" 
                  data-action="start-quiz" 
                  data-quiz-id="${quiz.id}"
                  ${quiz.attempts >= quiz.maxAttempts ? 'disabled' : ''}
                >
                  ${quiz.attempts >= quiz.maxAttempts ? 'Limite atteinte' : quiz.attempts > 0 ? 'Réessayer' : 'Commencer'}
                </button>
              </article>
            `).join('')}
          </div>
        `
      }
    `;

    return section;
  }

  // ============================================================
  // Onglet: Examens
  // ============================================================

  /**
   * Rend la liste des examens.
   * @returns {HTMLElement}
   * @private
   */
  _renderExamsTab() {
    const exams = this.controller?.getAvailableExams?.() || [];

    const section = this.createElement('section', {
      classNames: ['assessment-section', 'exams-section'],
      attributes: { 'aria-labelledby': 'exams-title' }
    });

    section.innerHTML = `
      <div class="section-toolbar">
        <h2 id="exams-title" class="section-title">Examens officiels</h2>
      </div>

      ${exams.length === 0
        ? `
          <div class="exams-info">
            <p class="exams-info__text">
              Les examens certifiants évaluent votre niveau selon le Cadre Européen Commun de Référence (CECRL).
              Ils sont disponibles à partir du niveau B1.
            </p>
            <div class="exam-types">
              <div class="exam-type-card">
                <span class="exam-type__icon" aria-hidden="true">📋</span>
                <h3>TEF Canada</h3>
                <p>Test d'Évaluation de Français</p>
              </div>
              <div class="exam-type-card">
                <span class="exam-type__icon" aria-hidden="true">📋</span>
                <h3>TCF</h3>
                <p>Test de Connaissance du Français</p>
              </div>
              <div class="exam-type-card">
                <span class="exam-type__icon" aria-hidden="true">📋</span>
                <h3>DELF/DALF</h3>
                <p>Diplôme d'Études en Langue Française</p>
              </div>
            </div>
          </div>
          ${this._renderEmptyState('Aucun examen programmé', '📅')}
        `
        : `
          <div class="exam-list">
            ${exams.map((exam, index) => `
              <article class="exam-card ${exam.locked ? 'exam-card--locked' : ''}" data-exam-index="${index}">
                <div class="exam-card__badge">
                  <span class="exam-card__level">${exam.level}</span>
                </div>
                <div class="exam-card__content">
                  <h3 class="exam-card__title">${this._escapeHtml(exam.title)}</h3>
                  <p class="exam-card__description">${this._escapeHtml(exam.description)}</p>
                  <div class="exam-card__details">
                    <span><span aria-hidden="true">📅</span> ${this._formatDate(exam.date)}</span>
                    <span><span aria-hidden="true">⏱️</span> ${exam.duration} min</span>
                    <span><span aria-hidden="true">🏢</span> ${this._escapeHtml(exam.location || 'En ligne')}</span>
                  </div>
                </div>
                <div class="exam-card__actions">
                  ${exam.registered
                    ? `<span class="badge badge--success">Inscrit ✅</span>`
                    : exam.locked
                      ? `<span class="badge badge--locked">🔒 Niveau ${exam.requiredLevel} requis</span>`
                      : `<button class="btn btn--primary" data-action="register-exam" data-exam-id="${exam.id}">S'inscrire</button>`
                  }
                </div>
              </article>
            `).join('')}
          </div>
        `
      }
    `;

    return section;
  }

  // ============================================================
  // Onglet: Résultats
  // ============================================================

  /**
   * Rend l'affichage des résultats.
   * @returns {HTMLElement}
   * @private
   */
  _renderResultsTab() {
    const results = this.controller?.getResults?.() || [];

    const section = this.createElement('section', {
      classNames: ['assessment-section', 'results-section'],
      attributes: { 'aria-labelledby': 'results-title' }
    });

    // Stats globales
    const avgScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length)
      : 0;

    section.innerHTML = `
      <div class="section-toolbar">
        <h2 id="results-title" class="section-title">Mes résultats</h2>
      </div>

      <div class="results-summary">
        <div class="result-stat">
          <span class="result-stat__value">${results.length}</span>
          <span class="result-stat__label">Évaluations passées</span>
        </div>
        <div class="result-stat">
          <span class="result-stat__value" style="color: ${avgScore >= 70 ? '#27ae60' : avgScore >= 50 ? '#f39c12' : '#e74c3c'}">${avgScore}%</span>
          <span class="result-stat__label">Score moyen</span>
        </div>
        <div class="result-stat">
          <span class="result-stat__value">${results.filter(r => (r.score || 0) >= 70).length}</span>
          <span class="result-stat__label">Réussites</span>
        </div>
      </div>

      ${results.length === 0
        ? this._renderEmptyState('Aucun résultat pour le moment', '📊')
        : `
          <div class="results-list">
            ${results.map((result, index) => `
              <article class="result-card" data-result-index="${index}">
                <div class="result-card__score-circle">
                  <svg viewBox="0 0 36 36" class="result-card__chart">
                    <path class="result-card__chart-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="result-card__chart-fill" 
                          stroke-dasharray="${result.score}, 100"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          style="stroke: ${result.score >= 70 ? '#27ae60' : result.score >= 50 ? '#f39c12' : '#e74c3c'}" />
                    <text x="18" y="20.35" class="result-card__chart-text">${result.score}%</text>
                  </svg>
                </div>
                <div class="result-card__content">
                  <h3 class="result-card__title">${this._escapeHtml(result.title)}</h3>
                  <p class="result-card__meta">
                    <span class="badge badge--${result.level?.toLowerCase()}">${result.level}</span>
                    <span>${this._formatDate(result.date)}</span>
                  </p>
                  <div class="result-card__breakdown">
                    ${result.breakdown?.map(b => `
                      <div class="breakdown-item">
                        <span class="breakdown-item__name">${this._escapeHtml(b.name)}</span>
                        <div class="breakdown-item__bar">
                          <div class="breakdown-item__fill" style="width: ${b.score}%; background-color: ${b.score >= 70 ? '#27ae60' : b.score >= 50 ? '#f39c12' : '#e74c3c'}"></div>
                        </div>
                        <span class="breakdown-item__score">${b.score}%</span>
                      </div>
                    `).join('') || ''}
                  </div>
                </div>
                <div class="result-card__actions">
                  <button class="btn btn--text" data-action="review-result" data-result-id="${result.id}">
                    Revoir →
                  </button>
                </div>
              </article>
            `).join('')}
          </div>
        `
      }
    `;

    return section;
  }

  // ============================================================
  // Onglet: Certificats
  // ============================================================

  /**
   * Rend la galerie de certificats.
   * @returns {HTMLElement}
   * @private
   */
  _renderCertificatesTab() {
    const certificates = this.controller?.getCertificates?.() || [];

    const section = this.createElement('section', {
      classNames: ['assessment-section', 'certificates-section'],
      attributes: { 'aria-labelledby': 'certificates-title' }
    });

    section.innerHTML = `
      <div class="section-toolbar">
        <h2 id="certificates-title" class="section-title">Mes certificats</h2>
      </div>

      ${certificates.length === 0
        ? `
          <div class="certificates-empty">
            ${this._renderEmptyState('Aucun certificat obtenu', '🏆')}
            <div class="certificates-info">
              <h3>Comment obtenir un certificat ?</h3>
              <ol class="certificates-steps">
                <li>Completez les quiz avec un score minimum de 70%</li>
                <li>Passez les examens officiels CECRL</li>
                <li>Vos certificats seront délivrés automatiquement</li>
              </ol>
            </div>
          </div>
        `
        : `
          <div class="certificates-grid">
            ${certificates.map((cert, index) => `
              <article class="certificate-card ${cert.shareable ? 'certificate-card--shareable' : ''}" data-certificate-index="${index}">
                <div class="certificate-card__preview">
                  <div class="certificate-preview">
                    <span class="certificate-preview__seal" aria-hidden="true">🎓</span>
                    <h3 class="certificate-preview__title">${this._escapeHtml(cert.title)}</h3>
                    <p class="certificate-preview__level">Niveau ${cert.level}</p>
                    <p class="certificate-preview__date">Obtenu le ${this._formatDate(cert.date)}</p>
                  </div>
                </div>
                <div class="certificate-card__details">
                  <h4>${this._escapeHtml(cert.title)}</h4>
                  <p>Score: <strong>${cert.score}%</strong></p>
                  <p>ID: <code>${cert.verificationId}</code></p>
                  <div class="certificate-card__actions">
                    <button class="btn btn--primary btn--small" data-action="download-certificate" data-cert-id="${cert.id}">
                      📥 Télécharger
                    </button>
                    <button class="btn btn--outline btn--small" data-action="share-certificate" data-cert-id="${cert.id}">
                      🔗 Partager
                    </button>
                    <button class="btn btn--text btn--small" data-action="verify-certificate" data-cert-id="${cert.id}">
                      ✅ Vérifier
                    </button>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        `
      }
    `;

    return section;
  }

  // ============================================================
  // Mode: Passage de quiz
  // ============================================================

  /**
   * Rend l'interface de passage de quiz.
   * @returns {HTMLElement}
   * @private
   */
  _renderQuizTaking() {
    const quiz = this.currentQuiz;
    if (!quiz) return this.createElement('div');

    const question = quiz.questions?.[this.currentQuestion];
    if (!question) return this.createElement('div');

    const progress = ((this.currentQuestion + 1) / quiz.questions.length) * 100;

    const section = this.createElement('section', {
      classNames: ['assessment-section', 'quiz-taking'],
      attributes: { 'aria-label': `Question ${this.currentQuestion + 1} sur ${quiz.questions.length}` }
    });

    section.innerHTML = `
      <div class="quiz-taking__header">
        <button class="btn btn--text" data-action="quit-quiz">← Quitter</button>
        <div class="quiz-taking__progress">
          <span>Question ${this.currentQuestion + 1} / ${quiz.questions.length}</span>
          ${quiz.duration ? `<span class="quiz-timer ${this.timeRemaining < 60 ? 'quiz-timer--warning' : ''}">⏱️ ${this._formatTime(this.timeRemaining)}</span>` : ''}
        </div>
      </div>

      <div class="quiz-progress-bar">
        <div class="quiz-progress-bar__fill" style="width: ${progress}%"></div>
      </div>

      <div class="quiz-question">
        <h2 class="quiz-question__text">${this._escapeHtml(question.text)}</h2>
        ${question.context ? `<p class="quiz-question__context">${this._escapeHtml(question.context)}</p>` : ''}

        ${question.audioUrl ? `
          <button class="btn btn--icon" data-action="play-question-audio" aria-label="Écouter la question">
            🔊 Écouter
          </button>
        ` : ''}

        <div class="quiz-question__answers">
          ${question.type === 'multiple_choice' && question.options
            ? question.options.map((opt, i) => `
                <label class="quiz-answer ${this.answers[this.currentQuestion] === i ? 'quiz-answer--selected' : ''}">
                  <input 
                    type="radio" 
                    name="quiz-answer" 
                    value="${i}" 
                    ${this.answers[this.currentQuestion] === i ? 'checked' : ''}
                    aria-label="${this._escapeHtml(opt)}"
                  />
                  <span class="quiz-answer__letter">${String.fromCharCode(65 + i)}</span>
                  <span class="quiz-answer__text">${this._escapeHtml(opt)}</span>
                </label>
              `).join('')
            : question.type === 'true_false'
              ? `
                <label class="quiz-answer ${this.answers[this.currentQuestion] === true ? 'quiz-answer--selected' : ''}">
                  <input type="radio" name="quiz-answer" value="true" ${this.answers[this.currentQuestion] === true ? 'checked' : ''} />
                  <span class="quiz-answer__text">Vrai</span>
                </label>
                <label class="quiz-answer ${this.answers[this.currentQuestion] === false ? 'quiz-answer--selected' : ''}">
                  <input type="radio" name="quiz-answer" value="false" ${this.answers[this.currentQuestion] === false ? 'checked' : ''} />
                  <span class="quiz-answer__text">Faux</span>
                </label>
              `
              : `
                <textarea 
                  class="form-textarea quiz-answer--open" 
                  rows="4" 
                  placeholder="Votre réponse..."
                  data-question-index="${this.currentQuestion}"
                >${this._escapeHtml(this.answers[this.currentQuestion] || '')}</textarea>
              `
          }
        </div>
      </div>

      <div class="quiz-taking__navigation">
        <button class="btn btn--outline" data-action="prev-question" ${this.currentQuestion === 0 ? 'disabled' : ''}>
          ← Précédent
        </button>
        <div class="quiz-question-nav">
          ${quiz.questions.map((_, i) => `
            <button 
              class="quiz-nav-dot ${i === this.currentQuestion ? 'quiz-nav-dot--active' : ''} ${this.answers[i] !== undefined ? 'quiz-nav-dot--answered' : ''}"
              data-action="go-to-question"
              data-question-index="${i}"
              aria-label="Question ${i + 1}${this.answers[i] !== undefined ? ' (répondue)' : ''}"
              aria-current="${i === this.currentQuestion ? 'true' : 'false'}"
            >
              ${i + 1}
            </button>
          `).join('')}
        </div>
        ${this.currentQuestion < quiz.questions.length - 1
          ? `<button class="btn btn--primary" data-action="next-question">Suivant →</button>`
          : `<button class="btn btn--primary" data-action="submit-quiz">Terminer ✓</button>`
        }
      </div>
    `;

    return section;
  }

  // ============================================================
  // Mode: Résultat de quiz
  // ============================================================

  /**
   * Rend l'affichage du résultat d'un quiz.
   * @returns {HTMLElement}
   * @private
   */
  _renderQuizResult() {
    const result = this.quizResult;
    if (!result) return this.createElement('div');

    const section = this.createElement('section', {
      classNames: ['assessment-section', 'quiz-result'],
      attributes: { 'aria-label': 'Résultat du quiz' }
    });

    section.innerHTML = `
      <div class="quiz-result__header">
        <h2 class="quiz-result__title">${this._escapeHtml(result.quizTitle)}</h2>
        <p class="quiz-result__subtitle">Résultat</p>
      </div>

      <div class="quiz-result__score">
        <div class="score-circle score-circle--${result.score >= 70 ? 'success' : result.score >= 50 ? 'average' : 'fail'}">
          <span class="score-circle__value">${result.score}%</span>
          <span class="score-circle__label">${result.score >= 70 ? 'Excellent ! 🎉' : result.score >= 50 ? 'Bien joué 👍' : 'Continuez à progresser 💪'}</span>
        </div>
      </div>

      <div class="quiz-result__breakdown">
        <h3>Détail par question</h3>
        ${result.answers?.map((ans, i) => `
          <div class="result-question ${ans.correct ? 'result-question--correct' : 'result-question--incorrect'}">
            <div class="result-question__header">
              <span class="result-question__number">Q${i + 1}</span>
              <span class="result-question__status" aria-hidden="true">${ans.correct ? '✅' : '❌'}</span>
            </div>
            <p class="result-question__text">${this._escapeHtml(ans.questionText)}</p>
            ${!ans.correct ? `
              <div class="result-question__correction">
                <p><strong>Votre réponse :</strong> ${this._escapeHtml(ans.userAnswer?.toString() || '-')}</p>
                <p><strong>Bonne réponse :</strong> ${this._escapeHtml(ans.correctAnswer?.toString() || '-')}</p>
                ${ans.explanation ? `<p><strong>Explication :</strong> ${this._escapeHtml(ans.explanation)}</p>` : ''}
              </div>
            ` : ''}
          </div>
        `).join('') || ''}
      </div>

      <div class="quiz-result__actions">
        <button class="btn btn--primary" data-action="retry-quiz" data-quiz-id="${result.quizId}">
          🔄 Réessayer
        </button>
        <button class="btn btn--outline" data-action="review-materials" data-quiz-id="${result.quizId}">
          📚 Réviser le contenu
        </button>
        <button class="btn btn--text" data-action="back-to-quizzes">
          ← Retour aux quiz
        </button>
      </div>
    `;

    return section;
  }

  // ============================================================
  // Navigation & Actions
  // ============================================================

  /**
   * Navigue vers un onglet.
   * @param {string} tab
   */
  navigateToTab(tab) {
    this.activeTab = tab;
    this.render();
  }

  /**
   * Démarre un quiz.
   * @param {Object} quiz
   */
  startQuiz(quiz) {
    this.currentQuiz = quiz;
    this.currentQuestion = 0;
    this.answers = {};
    this.timeRemaining = (quiz.duration || 0) * 60;
    this.activeTab = 'quiz-taking';

    if (quiz.duration) {
      this._startTimer();
    }

    this.render();
  }

  /**
   * Passe à la question suivante.
   */
  nextQuestion() {
    if (this.currentQuestion < (this.currentQuiz?.questions?.length || 0) - 1) {
      this.currentQuestion++;
      this.render();
    }
  }

  /**
   * Revient à la question précédente.
   */
  previousQuestion() {
    if (this.currentQuestion > 0) {
      this.currentQuestion--;
      this.render();
    }
  }

  /**
   * Va à une question spécifique.
   * @param {number} index
   */
  goToQuestion(index) {
    this.currentQuestion = index;
    this.render();
  }

  /**
   * Enregistre une réponse.
   * @param {number} questionIndex
   * @param {any} answer
   */
  setAnswer(questionIndex, answer) {
    this.answers[questionIndex] = answer;
  }

  /**
   * Soumet le quiz.
   */
  submitQuiz() {
    this._stopTimer();
    this.controller?.onSubmitQuiz?.(this.currentQuiz?.id, this.answers);
  }

  /**
   * Affiche le résultat du quiz.
   * @param {Object} result
   */
  showQuizResult(result) {
    this.quizResult = result;
    this.activeTab = 'quiz-result';
    this.render();
  }

  /**
   * Quitte le quiz en cours.
   */
  quitQuiz() {
    this._stopTimer();
    this.currentQuiz = null;
    this.activeTab = 'quizzes';
    this.render();
  }

  // ============================================================
  // Timer
  // ============================================================

  _startTimer() {
    this._stopTimer();
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      const timerEl = this.query('.quiz-timer');
      if (timerEl) {
        timerEl.textContent = `⏱️ ${this._formatTime(this.timeRemaining)}`;
        if (this.timeRemaining < 60) {
          timerEl.classList.add('quiz-timer--warning');
        }
      }
      if (this.timeRemaining <= 0) {
        this.submitQuiz();
      }
    }, 1000);
  }

  _stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
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

    // Filtres quiz
    this.bind('[data-filter="quiz-level"]', 'change', (e) => {
      this.controller?.onFilterQuizzes?.('level', e.target.value);
    });

    this.bind('[data-filter="quiz-category"]', 'change', (e) => {
      this.controller?.onFilterQuizzes?.('category', e.target.value);
    });

    // Démarrer un quiz
    this.queryAll('[data-action="start-quiz"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const quizId = e.currentTarget.dataset.quizId;
        this.controller?.onStartQuiz?.(quizId);
      });
    });

    // Inscription à un examen
    this.queryAll('[data-action="register-exam"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const examId = e.currentTarget.dataset.examId;
        this.controller?.onRegisterExam?.(examId);
      });
    });

    // Revoir un résultat
    this.queryAll('[data-action="review-result"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const resultId = e.currentTarget.dataset.resultId;
        this.controller?.onReviewResult?.(resultId);
      });
    });

    // Certificats
    this.queryAll('[data-action="download-certificate"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const certId = e.currentTarget.dataset.certId;
        this.controller?.onDownloadCertificate?.(certId);
      });
    });

    this.queryAll('[data-action="share-certificate"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const certId = e.currentTarget.dataset.certId;
        this.controller?.onShareCertificate?.(certId);
      });
    });

    this.queryAll('[data-action="verify-certificate"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const certId = e.currentTarget.dataset.certId;
        this.controller?.onVerifyCertificate?.(certId);
      });
    });

    // Mode quiz-taking
    if (this.activeTab === 'quiz-taking') {
      // Réponses
      this.queryAll('input[name="quiz-answer"]').forEach(input => {
        this.bind(input, 'change', (e) => {
          const value = e.currentTarget.value === 'true' ? true :
            e.currentTarget.value === 'false' ? false :
              parseInt(e.currentTarget.value);
          this.setAnswer(this.currentQuestion, value);

          // Mettre à jour l'UI visuelle
          this.queryAll('.quiz-answer').forEach(el => el.classList.remove('quiz-answer--selected'));
          e.currentTarget.closest('.quiz-answer')?.classList.add('quiz-answer--selected');
        });
      });

      // Réponses ouvertes
      this.queryAll('.quiz-answer--open').forEach(textarea => {
        this.bind(textarea, 'input', (e) => {
          const qIndex = parseInt(e.currentTarget.dataset.questionIndex);
          this.setAnswer(qIndex, e.currentTarget.value);
        });
      });

      // Navigation
      this.bind('[data-action="prev-question"]', 'click', () => this.previousQuestion());
      this.bind('[data-action="next-question"]', 'click', () => this.nextQuestion());
      this.bind('[data-action="submit-quiz"]', 'click', () => this.submitQuiz());
      this.bind('[data-action="quit-quiz"]', 'click', () => {
        if (confirm('Voulez-vous vraiment quitter ce quiz ? Votre progression sera perdue.')) {
          this.quitQuiz();
        }
      });

      // Navigation rapide
      this.queryAll('[data-action="go-to-question"]').forEach(btn => {
        this.bind(btn, 'click', (e) => {
          const index = parseInt(e.currentTarget.dataset.questionIndex);
          this.goToQuestion(index);
        });
      });

      // Audio
      this.bind('[data-action="play-question-audio"]', 'click', () => {
        this.controller?.onPlayQuestionAudio?.(this.currentQuestion);
      });
    }

    // Mode quiz-result
    if (this.activeTab === 'quiz-result') {
      this.bind('[data-action="retry-quiz"]', 'click', (e) => {
        const quizId = e.currentTarget.dataset.quizId;
        this.controller?.onRetryQuiz?.(quizId);
      });

      this.bind('[data-action="review-materials"]', 'click', (e) => {
        const quizId = e.currentTarget.dataset.quizId;
        this.controller?.onReviewMaterials?.(quizId);
      });

      this.bind('[data-action="back-to-quizzes"]', 'click', () => {
        this.navigateToTab('quizzes');
      });
    }
  }

  // ============================================================
  // Utilitaires
  // ============================================================

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  _formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    this._stopTimer();
    super.destroy();
  }
}
