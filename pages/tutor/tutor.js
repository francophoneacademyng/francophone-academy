/**
 * tutor.js — Page AI Tutor
 */

import { AuthController } from '../../src/controllers/AuthController.js';
import { TutorController } from '../../src/controllers/TutorController.js';

// Auth Guard
if (!AuthController.isAuthenticated()) {
  window.location.href = '../login/login.html';
}

// Extraire contexte de l'URL (integration avec Lesson Player)
const urlParams = new URLSearchParams(window.location.search);
const context = {
  courseId: urlParams.get('course') || '',
  courseTitle: urlParams.get('courseTitle') || '',
  moduleId: urlParams.get('module') || '',
  moduleTitle: urlParams.get('moduleTitle') || '',
  lessonId: urlParams.get('lesson') || '',
  lessonTitle: urlParams.get('lessonTitle') || '',
  cefrLevel: urlParams.get('level') || 'A1'
};

// Controller
const controller = new TutorController();

// Elements
const messagesEl = document.getElementById('tutor-messages');
const inputEl = document.getElementById('tutor-input');
const typingEl = document.getElementById('typing-indicator');
const sessionsEl = document.getElementById('sessions-list');
const cefrBadge = document.getElementById('cefr-badge');
const contextLesson = document.getElementById('context-lesson');
const sidebar = document.getElementById('tutor-sidebar');

// View
const view = {
  renderLoading: (msg) => {
    messagesEl.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p>${msg}</p></div>`;
  },
  renderError: (msg) => {
    messagesEl.innerHTML = `<div class="error-state"><div class="error-icon">&#9888;</div><p>${msg}</p></div>`;
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

  renderChat: (session, messages) => {
    // Contexte
    if (context.lessonTitle) {
      contextLesson.textContent = context.lessonTitle;
      document.title = `Tutor — ${context.lessonTitle}`;
    } else if (context.courseTitle) {
      contextLesson.textContent = context.courseTitle;
    }
    cefrBadge.textContent = `Niveau ${context.cefrLevel || 'A1'}`;

    if (messages.length === 0) {
      view.renderWelcome();
    } else {
      view.renderMessages(messages);
    }
  },

  renderWelcome: () => {
    messagesEl.innerHTML = `
      <div class="empty-state" style="padding:var(--space-8)">
        <div class="empty-icon" style="font-size:4rem">&#129302;</div>
        <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:var(--space-2)">Bienvenue sur AI Tutor !</h2>
        <p style="color:var(--text-secondary);max-width:400px">Je suis votre tuteur personnel. Je connais votre cours et votre niveau ${context.cefrLevel || 'A1'}.</p>
        <p style="color:var(--text-muted);font-size:0.875rem;margin-top:var(--space-3)">Posez une question ou utilisez les suggestions ci-dessous.</p>
      </div>
    `;
  },

  renderMessages: (messages) => {
    messagesEl.innerHTML = '';
    messages.forEach(msg => view._appendMessage(msg));
    view._scrollToBottom();
  },

  addUserMessage: (content) => {
    view._appendMessage({ role: 'user', content, timestamp: new Date().toISOString() });
    view._scrollToBottom();
  },

  addAssistantMessage: (msg) => {
    view._appendMessage({ role: 'assistant', content: msg.content, type: msg.type, metadata: msg.metadata, timestamp: msg.timestamp || new Date().toISOString() });
    view._scrollToBottom();
  },

  _appendMessage: (msg) => {
    const isUser = msg.role === 'user';
    const div = document.createElement('div');
    div.className = `message message--${isUser ? 'user' : 'assistant'}`;

    const avatar = isUser ? '&#128100;' : '&#129302;';
    const bubbleContent = view._formatMessageContent(msg.content || '');

    div.innerHTML = `
      <div class="message__avatar">${avatar}</div>
      <div class="message__bubble">${bubbleContent}</div>
    `;
    messagesEl.appendChild(div);
  },

  _formatMessageContent: (content) => {
    if (!content) return '';
    // Markdown basique
    let html = content
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^&gt;\s*(.+)$/gm, '<blockquote style="border-left:3px solid var(--primary);padding-left:var(--space-3);color:var(--text-secondary);margin:var(--space-2) 0">$1</blockquote>')
      .replace(/`(.+?)`/g, '<code style="background:var(--bg-hover);padding:2px 6px;border-radius:var(--radius-sm);font-size:0.875em">$1</code>')
      .replace(/\n/g, '<br>');
    return html;
  },

  showTypingIndicator: () => { typingEl.hidden = false; view._scrollToBottom(); },
  hideTypingIndicator: () => { typingEl.hidden = true; },

  renderSessions: (sessions) => {
    if (sessions.length === 0) {
      sessionsEl.innerHTML = '<p style="padding:var(--space-3);color:rgba(255,255,255,0.4);font-size:0.8125rem;text-align:center">Aucune conversation</p>';
      return;
    }
    sessionsEl.innerHTML = sessions.map(s => `
      <button class="session-item ${s.id === controller._sessionId ? 'session-item--active' : ''}" data-session-id="${s.id}">
        <span class="session-item__icon">&#128172;</span>
        <span class="session-item__title">${s.title || 'Conversation'}</span>
        <span class="session-item__time">${view._formatTime(s.lastMessageAt)}</span>
      </button>
    `).join('');

    sessionsEl.querySelectorAll('.session-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sessionId = e.currentTarget.dataset.sessionId;
        controller.onLoadSession(sessionId);
        if (window.innerWidth <= 768) sidebar.classList.remove('tutor-sidebar--open');
      });
    });
  },

  _scrollToBottom: () => { messagesEl.scrollTop = messagesEl.scrollHeight; },
  _formatTime: (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
};

controller.setView(view);

// Send message
function sendMessage() {
  const content = inputEl.value.trim();
  if (!content) return;
  inputEl.value = '';
  inputEl.style.height = 'auto';
  controller.onSendMessage(content);
}

document.getElementById('btn-send').addEventListener('click', sendMessage);
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
});

// Suggestions
document.getElementById('tutor-suggestions').addEventListener('click', (e) => {
  const chip = e.target.closest('.suggestion-chip');
  if (!chip) return;
  const action = chip.dataset.action;
  switch (action) {
    case 'lesson-help': controller.onRequestLessonHelp(); break;
    case 'exercise': controller.onGenerateExercise('grammar'); break;
    case 'quiz': controller.onGenerateQuiz(); break;
    case 'grammar': controller.onRequestGrammar(''); break;
    case 'vocabulary': inputEl.value = 'Donne-moi du vocabulaire sur '; inputEl.focus(); break;
    case 'correction': {
      inputEl.value = 'Corrige ma phrase : ""';
      inputEl.focus();
      // Positionner le curseur entre les guillemets
      const pos = inputEl.value.length - 1;
      inputEl.setSelectionRange(pos, pos);
      break;
    }
  }
});

// New session
document.getElementById('btn-new-session').addEventListener('click', () => controller.onNewSession());

// Toggle sidebar
document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
  sidebar.classList.toggle('tutor-sidebar--open');
});

// Help
document.getElementById('btn-help-tutor').addEventListener('click', () => {
  view.showToast('AI Tutor : posez des questions, demandez des exercices, des corrections ou des traductions !', 'info', 5000);
});

// Init
controller.init(context).then(() => {
  // Charger les sessions historiques
  controller.loadRecentSessions().then(sessions => view.renderSessions(sessions));
});
