/**
 * TutorView.js
 * View du tuteur IA : chat, messages, exercices, corrections, prononciation, historique.
 *
 * Événements capturés → transmis au TutorController.
 */

import { BaseView } from './BaseView.js';

/**
 * @class TutorView
 * @extends BaseView
 * Gère l'interface du tuteur IA conversationnel.
 */
export class TutorView extends BaseView {
  constructor(options = {}) {
    super({
      viewName: 'TutorView',
      ...options
    });

    this.messages = [];
    this.currentExercise = null;
    this.isRecording = false;
    this.activeTab = 'chat'; // 'chat' | 'exercise' | 'pronunciation' | 'history'
  }

  // ============================================================
  // Rendu principal
  // ============================================================

  /**
   * Rend l'interface complète du tuteur IA.
   * @returns {HTMLElement}
   */
  render() {
    this.clear();

    const wrapper = this.createElement('div', {
      classNames: ['tutor-view'],
      attributes: { 'data-tutor-view': '' }
    });

    // Sidebar avec historique
    wrapper.appendChild(this._renderSidebar());

    // Zone principale
    const main = this.createElement('div', {
      classNames: ['tutor-main']
    });

    // Onglets
    main.appendChild(this._renderTabs());

    // Contenu selon l'onglet actif
    const contentArea = this.createElement('div', {
      classNames: ['tutor-content'],
      attributes: { 'data-active-tab': this.activeTab }
    });

    switch (this.activeTab) {
      case 'chat':
        contentArea.appendChild(this._renderChatArea());
        break;
      case 'exercise':
        contentArea.appendChild(this._renderExerciseArea());
        break;
      case 'pronunciation':
        contentArea.appendChild(this._renderPronunciationArea());
        break;
      case 'history':
        contentArea.appendChild(this._renderHistoryArea());
        break;
    }

    main.appendChild(contentArea);
    wrapper.appendChild(main);

    this.container.appendChild(wrapper);

    // Scroll en bas du chat
    if (this.activeTab === 'chat') {
      requestAnimationFrame(() => this._scrollToBottom());
    }

    return this.container;
  }

  // ============================================================
  // Sidebar
  // ============================================================

  /**
   * Rend la sidebar avec l'historique des conversations.
   * @returns {HTMLElement}
   * @private
   */
  _renderSidebar() {
    const sessions = this.controller?.getChatSessions?.() || [];

    const sidebar = this.createElement('aside', {
      classNames: ['tutor-sidebar'],
      attributes: { 'aria-label': 'Historique des conversations' }
    });

    sidebar.innerHTML = `
      <div class="tutor-sidebar__header">
        <h2 class="tutor-sidebar__title">🎓 IA Tutor</h2>
        <button class="btn btn--primary btn--small" data-action="new-chat" aria-label="Nouvelle conversation">
          <span aria-hidden="true">+</span> Nouveau
        </button>
      </div>

      <div class="tutor-sidebar__search">
        <input 
          type="search" 
          class="form-input form-input--search" 
          placeholder="Rechercher dans l'historique..."
          data-action="search-history"
          aria-label="Rechercher dans l'historique"
        />
      </div>

      <div class="tutor-sidebar__sessions">
        ${sessions.length === 0
          ? `<p class="tutor-sidebar__empty">Aucune conversation</p>`
          : `<ul class="session-list" role="list">
              ${sessions.map((session, index) => `
                <li class="session-item ${session.active ? 'session-item--active' : ''}" 
                    data-session-index="${index}"
                    role="button"
                    tabindex="0"
                    aria-selected="${session.active ? 'true' : 'false'}">
                  <div class="session-item__icon" aria-hidden="true">💬</div>
                  <div class="session-item__info">
                    <p class="session-item__title">${this._escapeHtml(session.title || 'Conversation')}</p>
                    <p class="session-item__preview">${this._escapeHtml(session.preview || '')}</p>
                  </div>
                  <button class="btn btn--icon btn--small session-item__delete" 
                          data-action="delete-session" 
                          data-index="${index}"
                          aria-label="Supprimer la conversation">
                    🗑️
                  </button>
                </li>
              `).join('')}
            </ul>`
        }
      </div>

      <div class="tutor-sidebar__footer">
        <div class="tutor-model-selector">
          <label for="tutor-model" class="visually-hidden">Modèle IA</label>
          <select id="tutor-model" class="form-select" data-action="change-model">
            <option value="gpt-4">GPT-4 (Premium)</option>
            <option value="gpt-3.5">GPT-3.5</option>
          </select>
        </div>
      </div>
    `;

    return sidebar;
  }

  // ============================================================
  // Onglets
  // ============================================================

  /**
   * Rend les onglets de navigation du tuteur.
   * @returns {HTMLElement}
   * @private
   */
  _renderTabs() {
    const tabs = [
      { id: 'chat', label: 'Chat', icon: '💬' },
      { id: 'exercise', label: 'Exercices', icon: '✏️' },
      { id: 'pronunciation', label: 'Prononciation', icon: '🎙️' },
      { id: 'history', label: 'Historique', icon: '📜' }
    ];

    return this.createElement('nav', {
      classNames: ['tutor-tabs'],
      attributes: { role: 'tablist', 'aria-label': 'Navigation du tuteur' },
      innerHTML: tabs.map(tab => `
        <button 
          class="tutor-tab ${this.activeTab === tab.id ? 'tutor-tab--active' : ''}"
          role="tab"
          aria-selected="${this.activeTab === tab.id ? 'true' : 'false'}"
          data-tab="${tab.id}"
          id="tab-${tab.id}"
          aria-controls="panel-${tab.id}"
        >
          <span class="tutor-tab__icon" aria-hidden="true">${tab.icon}</span>
          <span class="tutor-tab__label">${tab.label}</span>
        </button>
      `).join('')
    });
  }

  // ============================================================
  // Zone: Chat
  // ============================================================

  /**
   * Rend la zone de chat IA.
   * @returns {HTMLElement}
   * @private
   */
  _renderChatArea() {
    const area = this.createElement('div', {
      classNames: ['chat-area'],
      attributes: { role: 'tabpanel', id: 'panel-chat', 'aria-labelledby': 'tab-chat' }
    });

    // Messages
    const messagesContainer = this.createElement('div', {
      classNames: ['chat-messages'],
      attributes: { 'aria-live': 'polite', 'aria-relevant': 'additions' }
    });

    if (this.messages.length === 0) {
      messagesContainer.appendChild(this._renderChatWelcome());
    } else {
      this.messages.forEach((msg, index) => {
        messagesContainer.appendChild(this._renderMessage(msg, index));
      });
    }

    // Suggestions rapides
    const suggestions = this.createElement('div', {
      classNames: ['chat-suggestions']
    });

    const quickPrompts = [
      'Corrige cette phrase',
      'Explique le subjonctif',
      'Un exercice de vocabulaire',
      'Traduis en français'
    ];

    quickPrompts.forEach(prompt => {
      const btn = this.createElement('button', {
        classNames: ['chat-suggestion-chip'],
        textContent: prompt,
        dataset: { suggestion: prompt }
      });
      suggestions.appendChild(btn);
    });

    // Input
    const inputArea = this.createElement('div', {
      classNames: ['chat-input-area']
    });

    inputArea.innerHTML = `
      <div class="chat-input-wrapper">
        <button class="btn btn--icon chat-input__attach" data-action="attach-file" aria-label="Joindre un fichier">
          📎
        </button>
        <textarea 
          class="chat-input" 
          id="chat-message-input"
          placeholder="Posez votre question en français..."
          rows="1"
          aria-label="Message"
        ></textarea>
        <button class="btn btn--icon chat-input__send" data-action="send-message" aria-label="Envoyer le message">
          ➤
        </button>
      </div>
      <div class="chat-input__options">
        <button class="btn btn--text btn--small" data-action="generate-exercise">
          ✏️ Générer un exercice
        </button>
        <button class="btn btn--text btn--small" data-action="check-grammar">
          🔍 Vérifier la grammaire
        </button>
      </div>
    `;

    area.appendChild(messagesContainer);
    area.appendChild(suggestions);
    area.appendChild(inputArea);

    return area;
  }

  /**
   * Rend le message de bienvenue du chat.
   * @returns {HTMLElement}
   * @private
   */
  _renderChatWelcome() {
    return this.createElement('div', {
      classNames: ['chat-welcome'],
      innerHTML: `
        <div class="chat-welcome__avatar" aria-hidden="true">🎓</div>
        <h2 class="chat-welcome__title">Bonjour ! Je suis votre tuteur IA</h2>
        <p class="chat-welcome__text">
          Je peux vous aider avec : la grammaire, le vocabulaire, la prononciation, 
          les exercices pratiques, et bien plus encore.
        </p>
        <div class="chat-welcome__capabilities">
          <span class="capability-tag">Grammaire</span>
          <span class="capability-tag">Vocabulaire</span>
          <span class="capability-tag">Conjugaison</span>
          <span class="capability-tag">Expression orale</span>
          <span class="capability-tag">Compréhension</span>
        </div>
      `
    });
  }

  /**
   * Rend un message individuel.
   * @param {Object} message
   * @param {number} index
   * @returns {HTMLElement}
   * @private
   */
  _renderMessage(message, index) {
    const isUser = message.role === 'user';
    const msgEl = this.createElement('div', {
      classNames: [
        'chat-message',
        isUser ? 'chat-message--user' : 'chat-message--assistant',
        message.isError ? 'chat-message--error' : ''
      ],
      attributes: { 'data-message-index': index }
    });

    msgEl.innerHTML = `
      <div class="chat-message__avatar" aria-hidden="true">
        ${isUser ? '👤' : '🎓'}
      </div>
      <div class="chat-message__content">
        <div class="chat-message__text">${this._formatMessageContent(message.content)}</div>
        ${message.correction ? `
          <div class="chat-message__correction">
            <p class="correction-title">✏️ Correction</p>
            <p class="correction-original">${this._escapeHtml(message.correction.original)}</p>
            <p class="correction-corrected">${this._escapeHtml(message.correction.corrected)}</p>
            <p class="correction-explanation">${this._escapeHtml(message.correction.explanation)}</p>
          </div>
        ` : ''}
        ${message.exercise ? this._renderInlineExercise(message.exercise) : ''}
        <div class="chat-message__meta">
          <time class="chat-message__time">${this._formatTime(message.timestamp)}</time>
          ${!isUser ? `
            <div class="chat-message__actions">
              <button class="btn btn--icon btn--small" data-action="copy-message" data-index="${index}" aria-label="Copier">
                📋
              </button>
              <button class="btn btn--icon btn--small" data-action="speak-message" data-index="${index}" aria-label="Lire à haute voix">
                🔊
              </button>
              <button class="btn btn--icon btn--small" data-action="regenerate-message" data-index="${index}" aria-label="Régénérer">
                🔄
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    return msgEl;
  }

  /**
   * Formate le contenu d'un message avec support markdown basique.
   * @param {string} content
   * @returns {string}
   * @private
   */
  _formatMessageContent(content) {
    if (!content) return '';
    // Échapper le HTML d'abord
    let safe = this._escapeHtml(content);
    // Markdown basique
    safe = safe
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
    return safe;
  }

  // ============================================================
  // Zone: Exercices
  // ============================================================

  /**
   * Rend la zone d'exercices.
   * @returns {HTMLElement}
   * @private
   */
  _renderExerciseArea() {
    const area = this.createElement('div', {
      classNames: ['exercise-area'],
      attributes: { role: 'tabpanel', id: 'panel-exercise', 'aria-labelledby': 'tab-exercise' }
    });

    area.innerHTML = `
      <div class="exercise-header">
        <h2 class="exercise-title">Exercices pratiques</h2>
        <div class="exercise-filters">
          <select class="form-select" data-filter="type" aria-label="Type d'exercice">
            <option value="">Tous les types</option>
            <option value="grammar">Grammaire</option>
            <option value="vocabulary">Vocabulaire</option>
            <option value="conjugation">Conjugaison</option>
            <option value="comprehension">Compréhension</option>
          </select>
          <select class="form-select" data-filter="level" aria-label="Niveau">
            <option value="">Tous les niveaux</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
          </select>
          <button class="btn btn--primary" data-action="generate-exercise">
            ✨ Générer un exercice IA
          </button>
        </div>
      </div>

      <div class="exercise-list" id="exercise-list">
        <!-- Rempli dynamiquement -->
        ${this._renderEmptyState('Sélectionnez des filtres ou générez un exercice personnalisé', '✏️')}
      </div>
    `;

    return area;
  }

  /**
   * Rend un exercice inline dans le chat.
   * @param {Object} exercise
   * @returns {string}
   * @private
   */
  _renderInlineExercise(exercise) {
    return `
      <div class="inline-exercise">
        <h4 class="inline-exercise__title">📝 ${this._escapeHtml(exercise.title || 'Exercice')}</h4>
        <p class="inline-exercise__instructions">${this._escapeHtml(exercise.instructions)}</p>
        ${exercise.questions?.map((q, i) => `
          <div class="inline-exercise__question">
            <p class="question-text">${i + 1}. ${this._escapeHtml(q.text)}</p>
            ${q.type === 'multiple_choice' ? `
              <div class="question-options">
                ${q.options?.map((opt, j) => `
                  <label class="question-option">
                    <input type="radio" name="ex-q-${i}" value="${j}" data-question="${i}" data-option="${j}">
                    <span>${this._escapeHtml(opt)}</span>
                  </label>
                `).join('')}
              </div>
            ` : q.type === 'fill_blank' ? `
              <input type="text" class="form-input question-input" data-question="${i}" placeholder="Votre réponse..." />
            ` : `
              <textarea class="form-textarea question-input" data-question="${i}" rows="3" placeholder="Votre réponse..."></textarea>
            `}
          </div>
        `).join('') || ''}
        <button class="btn btn--primary" data-action="submit-exercise" data-exercise-id="${exercise.id}">
          Vérifier mes réponses
        </button>
      </div>
    `;
  }

  // ============================================================
  // Zone: Prononciation
  // ============================================================

  /**
   * Rend la zone de pratique de prononciation.
   * @returns {HTMLElement}
   * @private
   */
  _renderPronunciationArea() {
    const area = this.createElement('div', {
      classNames: ['pronunciation-area'],
      attributes: { role: 'tabpanel', id: 'panel-pronunciation', 'aria-labelledby': 'tab-pronunciation' }
    });

    area.innerHTML = `
      <div class="pronunciation-header">
        <h2 class="pronunciation-title">Pratique de prononciation</h2>
        <p class="pronunciation-subtitle">Enregistrez-vous et recevez des corrections instantanées</p>
      </div>

      <div class="pronunciation-practice">
        <div class="pronunciation-target">
          <p class="pronunciation-label">Phrase à prononcer :</p>
          <p class="pronunciation-phrase" id="pronunciation-phrase">${this._escapeHtml(this.currentPhrase || 'Bonjour, comment allez-vous aujourd\'hui ?')}</p>
          <button class="btn btn--icon" data-action="speak-phrase" aria-label="Écouter la phrase">
            🔊
          </button>
          <button class="btn btn--icon" data-action="next-phrase" aria-label="Phrase suivante">
            ⏭️
          </button>
        </div>

        <div class="pronunciation-recorder">
          <button 
            class="record-button ${this.isRecording ? 'record-button--recording' : ''}" 
            data-action="toggle-recording"
            aria-label="${this.isRecording ? 'Arrêter l\'enregistrement' : 'Commencer l\'enregistrement'}"
          >
            <span class="record-button__icon" aria-hidden="true">🎙️</span>
            <span class="record-button__label">${this.isRecording ? 'Arrêter' : 'Appuyez pour parler'}</span>
          </button>
          ${this.isRecording ? `
            <div class="recording-indicator">
              <span class="recording-dot"></span>
              <span>Enregistrement en cours...</span>
            </div>
          ` : ''}
        </div>

        <div class="pronunciation-feedback" id="pronunciation-feedback">
          <!-- Feedback dynamique après analyse -->
        </div>
      </div>

      <div class="pronunciation-exercises">
        <h3 class="pronunciation-section-title">Exercices de prononciation</h3>
        <div class="pronunciation-exercise-grid">
          ${[
            { title: 'Voyelles nasales', desc: 'an, en, on, un', icon: '🔤' },
            { title: 'Le son R', desc: 'Roulé ou uvulaire', icon: '🇫🇷' },
            { title: 'Liaisons', desc: 'Enchaînement des mots', icon: '🔗' },
            { title: 'Intonation', desc: 'Questions et exclamations', icon: '📢' }
          ].map((ex, i) => `
            <button class="pronunciation-card" data-pronunciation-exercise="${i}">
              <span class="pronunciation-card__icon" aria-hidden="true">${ex.icon}</span>
              <h4 class="pronunciation-card__title">${this._escapeHtml(ex.title)}</h4>
              <p class="pronunciation-card__desc">${this._escapeHtml(ex.desc)}</p>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    return area;
  }

  // ============================================================
  // Zone: Historique
  // ============================================================

  /**
   * Rend la zone d'historique détaillé.
   * @returns {HTMLElement}
   * @private
   */
  _renderHistoryArea() {
    const history = this.controller?.getFullHistory?.() || [];

    const area = this.createElement('div', {
      classNames: ['history-area'],
      attributes: { role: 'tabpanel', id: 'panel-history', 'aria-labelledby': 'tab-history' }
    });

    area.innerHTML = `
      <div class="history-header">
        <h2 class="history-title">Historique des interactions</h2>
        <div class="history-stats">
          <div class="history-stat">
            <span class="history-stat__value">${history.length}</span>
            <span class="history-stat__label">sessions</span>
          </div>
          <div class="history-stat">
            <span class="history-stat__value">${this._countExercises(history)}</span>
            <span class="history-stat__label">exercices</span>
          </div>
          <div class="history-stat">
            <span class="history-stat__value">${this._countCorrections(history)}</span>
            <span class="history-stat__label">corrections</span>
          </div>
        </div>
      </div>

      ${history.length === 0
        ? this._renderEmptyState('Aucun historique disponible', '📭')
        : `
          <ul class="history-list" role="list">
            ${history.map((item, index) => `
              <li class="history-item" data-history-index="${index}">
                <div class="history-item__icon" aria-hidden="true">${this._getHistoryIcon(item.type)}</div>
                <div class="history-item__content">
                  <p class="history-item__title">${this._escapeHtml(item.title)}</p>
                  <p class="history-item__meta">
                    <span>${this._getHistoryTypeLabel(item.type)}</span>
                    <span>·</span>
                    <time>${this._formatRelativeTime(item.timestamp)}</time>
                  </p>
                </div>
                ${item.score !== undefined ? `
                  <span class="history-item__score">${item.score}%</span>
                ` : ''}
              </li>
            `).join('')}
          </ul>
        `
      }
    `;

    return area;
  }

  // ============================================================
  // Actions sur les messages
  // ============================================================

  /**
   * Ajoute un message au chat.
   * @param {Object} message
   */
  addMessage(message) {
    this.messages.push(message);
    const container = this.query('.chat-messages');
    if (!container) return;

    // Retirer le welcome si premier message
    if (this.messages.length === 1) {
      const welcome = container.querySelector('.chat-welcome');
      if (welcome) welcome.remove();
    }

    const msgEl = this._renderMessage(message, this.messages.length - 1);
    container.appendChild(msgEl);
    this._scrollToBottom();
  }

  /**
   * Affiche l'indicateur de saisie du tuteur.
   */
  showTypingIndicator() {
    const container = this.query('.chat-messages');
    if (!container || container.querySelector('.typing-indicator')) return;

    const indicator = this.createElement('div', {
      classNames: ['typing-indicator'],
      attributes: { 'aria-label': 'Le tuteur est en train d\'écrire' },
      innerHTML: `
        <div class="typing-indicator__avatar" aria-hidden="true">🎓</div>
        <div class="typing-indicator__dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `
    });

    container.appendChild(indicator);
    this._scrollToBottom();
  }

  /**
   * Masque l'indicateur de saisie.
   */
  hideTypingIndicator() {
    const indicator = this.query('.typing-indicator');
    if (indicator) indicator.remove();
  }

  /**
   * Définit la phrase de prononciation courante.
   * @param {string} phrase
   */
  setPronunciationPhrase(phrase) {
    this.currentPhrase = phrase;
    const phraseEl = this.query('#pronunciation-phrase');
    if (phraseEl) phraseEl.textContent = phrase;
  }

  /**
   * Affiche le feedback de prononciation.
   * @param {Object} feedback
   */
  showPronunciationFeedback(feedback) {
    const container = this.query('#pronunciation-feedback');
    if (!container) return;

    container.innerHTML = `
      <div class="pronunciation-feedback__score">
        <span class="score-value" style="color: ${feedback.score >= 70 ? '#27ae60' : feedback.score >= 40 ? '#f39c12' : '#e74c3c'}">
          ${feedback.score}%
        </span>
        <span class="score-label">Score de prononciation</span>
      </div>
      ${feedback.words?.map(w => `
        <span class="pronunciation-word pronunciation-word--${w.accuracy}">${this._escapeHtml(w.word)}</span>
      `).join(' ') || ''}
      ${feedback.suggestions?.length ? `
        <div class="pronunciation-suggestions">
          <p><strong>Suggestions :</strong></p>
          <ul>
            ${feedback.suggestions.map(s => `<li>${this._escapeHtml(s)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    `;
  }

  // ============================================================
  // Événements
  // ============================================================

  _bindEvents() {
    // Changement d'onglet
    this.queryAll('[data-tab]').forEach(tab => {
      this.bind(tab, 'click', (e) => {
        this.activeTab = e.currentTarget.dataset.tab;
        this.render();
      });
    });

    // Nouveau chat
    this.bind('[data-action="new-chat"]', 'click', () => {
      this.controller?.onNewChat?.();
    });

    // Sélection de session
    this.queryAll('[data-session-index]').forEach(item => {
      this.bind(item, 'click', (e) => {
        if (e.target.closest('[data-action="delete-session"]')) return;
        const index = parseInt(e.currentTarget.dataset.sessionIndex);
        this.controller?.onSelectSession?.(index);
      });
    });

    // Suppression de session
    this.queryAll('[data-action="delete-session"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index);
        this.controller?.onDeleteSession?.(index);
      });
    });

    // Changement de modèle IA
    this.bind('[data-action="change-model"]', 'change', (e) => {
      this.controller?.onChangeModel?.(e.target.value);
    });

    // Envoi de message
    const sendBtn = this.query('[data-action="send-message"]');
    const input = this.query('#chat-message-input');

    if (sendBtn && input) {
      this.bind(sendBtn, 'click', () => this._sendMessage());
      this.bind(input, 'keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this._sendMessage();
        }
      });
    }

    // Suggestions rapides
    this.queryAll('[data-suggestion]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const suggestion = e.currentTarget.dataset.suggestion;
        if (input) input.value = suggestion;
        this._sendMessage(suggestion);
      });
    });

    // Actions message
    this.queryAll('[data-action="copy-message"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this._copyMessage(index);
      });
    });

    this.queryAll('[data-action="speak-message"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.controller?.onSpeakMessage?.(index);
      });
    });

    this.queryAll('[data-action="regenerate-message"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.controller?.onRegenerateMessage?.(index);
      });
    });

    // Génération d'exercice
    this.queryAll('[data-action="generate-exercise"]').forEach(btn => {
      this.bind(btn, 'click', () => {
        this.controller?.onGenerateExercise?.();
      });
    });

    // Vérification grammaticale
    this.bind('[data-action="check-grammar"]', 'click', () => {
      const text = input?.value?.trim();
      if (text) this.controller?.onCheckGrammar?.(text);
    });

    // Soumission d'exercice inline
    this.queryAll('[data-action="submit-exercise"]').forEach(btn => {
      this.bind(btn, 'click', (e) => {
        const exerciseId = e.currentTarget.dataset.exerciseId;
        const answers = this._collectExerciseAnswers();
        this.controller?.onSubmitExercise?.(exerciseId, answers);
      });
    });

    // Fichier attaché
    this.bind('[data-action="attach-file"]', 'click', () => {
      this.controller?.onAttachFile?.();
    });

    // Prononciation
    this.bind('[data-action="toggle-recording"]', 'click', () => {
      this.isRecording = !this.isRecording;
      this.controller?.onToggleRecording?.();
      if (this.activeTab === 'pronunciation') {
        this.render();
      }
    });

    this.bind('[data-action="speak-phrase"]', 'click', () => {
      this.controller?.onSpeakPhrase?.(this.currentPhrase);
    });

    this.bind('[data-action="next-phrase"]', 'click', () => {
      this.controller?.onNextPhrase?.();
    });

    // Exercices de prononciation
    this.queryAll('[data-pronunciation-exercise]').forEach(card => {
      this.bind(card, 'click', (e) => {
        const index = parseInt(e.currentTarget.dataset.pronunciationExercise);
        this.controller?.onSelectPronunciationExercise?.(index);
      });
    });

    // Recherche dans l'historique
    this.bind('[data-action="search-history"]', 'input', (e) => {
      this.controller?.onSearchHistory?.(e.target.value);
    });

    // Filtres exercices
    this.queryAll('[data-filter]').forEach(select => {
      this.bind(select, 'change', (e) => {
        const filterType = e.currentTarget.dataset.filter;
        this.controller?.onFilterExercises?.(filterType, e.target.value);
      });
    });
  }

  // ============================================================
  // Méthodes privées
  // ============================================================

  _sendMessage(text = null) {
    const input = this.query('#chat-message-input');
    const message = text || input?.value?.trim();
    if (!message) return;

    if (input && !text) input.value = '';
    this.controller?.onSendMessage?.(message);
  }

  _scrollToBottom() {
    const container = this.query('.chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  async _copyMessage(index) {
    const message = this.messages[index];
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message.content);
      this.showToast('Message copié', 'success');
    } catch {
      this.showToast('Impossible de copier', 'error');
    }
  }

  _collectExerciseAnswers() {
    const answers = [];
    this.queryAll('.inline-exercise [data-question]').forEach(el => {
      const questionIndex = parseInt(el.dataset.question);
      if (el.type === 'radio' && el.checked) {
        answers[questionIndex] = parseInt(el.dataset.option);
      } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        answers[questionIndex] = el.value;
      }
    });
    return answers;
  }

  _countExercises(history) {
    return history.filter(h => h.type === 'exercise').length;
  }

  _countCorrections(history) {
    return history.filter(h => h.type === 'correction').length;
  }

  _getHistoryIcon(type) {
    const icons = {
      chat: '💬',
      exercise: '✏️',
      correction: '✅',
      pronunciation: '🎙️',
      grammar: '🔍'
    };
    return icons[type] || '📝';
  }

  _getHistoryTypeLabel(type) {
    const labels = {
      chat: 'Conversation',
      exercise: 'Exercice',
      correction: 'Correction',
      pronunciation: 'Prononciation',
      grammar: 'Grammaire'
    };
    return labels[type] || type;
  }

  _formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
