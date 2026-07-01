/**
 * lesson.js — Page Lesson Player
 */

import { AuthController } from '../../src/controllers/AuthController.js';
import { LearningController } from '../../src/controllers/LearningController.js';

// Auth Guard
if (!AuthController.isAuthenticated()) {
  window.location.href = '../login/login.html';
}

// Extraire params de l'URL
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('course');
const lessonIdFromUrl = urlParams.get('lesson');
if (!courseId) {
  window.location.href = '../courses/courses.html';
}

// Contexte pour le AI Tutor (mis a jour quand une lecon est chargee)
let tutorContext = {
  courseId: courseId,
  lessonId: lessonIdFromUrl || '',
  lessonTitle: '',
  cefrLevel: 'A1'
};

// Controller
const controller = new LearningController();

// Elements DOM
const contentEl = document.getElementById('lesson-content');
const lessonTitleEl = document.getElementById('lesson-title');
const courseTitleEl = document.getElementById('course-title');
const modulesListEl = document.getElementById('modules-list');
const progressBar = document.getElementById('course-progress-bar');
const progressText = document.getElementById('course-progress-text');
const sidebar = document.getElementById('lesson-sidebar');

// View inline
const view = {
  renderLoading: (msg) => {
    contentEl.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p>${msg}</p></div>`;
  },
  renderError: (msg) => {
    contentEl.innerHTML = `<div class="error-state"><div class="error-icon">&#9888;</div><p>${msg}</p></div>`;
  },
  showToast: (message, type = 'info', duration = 3000) => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => { toast.classList.remove('toast--visible'); setTimeout(() => toast.remove(), 300); }, duration);
  },
  setLoading: (loading) => {
    document.getElementById('btn-complete').disabled = loading;
    document.getElementById('btn-complete-footer').disabled = loading;
  },
  updateProgress: (percentage) => {
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}%`;
  },

  renderCourse: (course, modules, enrollment) => {
    courseTitleEl.textContent = course.title;
    const progress = enrollment?.progress || 0;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;

    // Render sidebar modules
    modulesListEl.innerHTML = modules.map((mod, modIdx) => `
      <div class="module-group ${modIdx === 0 ? 'module-group--expanded' : ''}" data-module="${mod.id}">
        <div class="module-group__header">
          <span>${mod.title}</span>
          <span class="module-group__toggle">&#9654;</span>
        </div>
        <ul class="module-group__lessons">
          ${(mod.lessons || []).map(lesson => {
            const isCompleted = enrollment?.completedLessons?.includes(lesson.id);
            return `<li><button class="lesson-nav-item" data-lesson-id="${lesson.id}" title="${lesson.title}">
              <span class="lesson-nav-item__icon">${isCompleted ? '&#9989;' : '&#9675;'}</span>
              <span class="lesson-nav-item__title">${lesson.title}</span>
              <span class="lesson-nav-item__duration">${lesson.duration}min</span>
            </button></li>`;
          }).join('')}
        </ul>
      </div>
    `).join('');

    // Bind module toggles
    modulesListEl.querySelectorAll('.module-group__header').forEach(header => {
      header.addEventListener('click', () => {
        header.parentElement.classList.toggle('module-group--expanded');
      });
    });

    // Bind lesson selection
    modulesListEl.querySelectorAll('.lesson-nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lessonId = e.currentTarget.dataset.lessonId;
        controller.onSelectLesson(lessonId);
        if (window.innerWidth <= 768) sidebar.classList.remove('lesson-sidebar--open');
      });
    });
  },

  renderLesson: (lesson, prev, next) => {
    lessonTitleEl.textContent = lesson.title || 'Lecon';

    // Mettre a jour le contexte du tutor
    tutorContext.lessonId = lesson.id || lessonIdFromUrl || '';
    tutorContext.lessonTitle = lesson.title || '';
    tutorContext.cefrLevel = lesson.level || 'A1';

    // Navigation buttons
    document.getElementById('btn-prev').disabled = !prev;
    document.getElementById('btn-next').disabled = !next;
    document.getElementById('btn-prev-footer').disabled = !prev;
    document.getElementById('btn-next-footer').disabled = !next;

    // Highlight active lesson in sidebar
    modulesListEl.querySelectorAll('.lesson-nav-item').forEach(btn => {
      btn.classList.toggle('lesson-nav-item--active', btn.dataset.lessonId === lesson.id);
    });

    // Build content
    let html = '';

    // Objectifs
    if (lesson.objectives?.length) {
      html += `<div class="lesson-objectives"><h3>&#127919; Objectifs</h3><ul>`;
      lesson.objectives.forEach(obj => { html += `<li>${obj}</li>`; });
      html += `</ul></div>`;
    }

    // Type badge
    const typeLabels = { theory: 'Theorie', exercise: 'Exercice', video: 'Video', audio: 'Audio', quiz: 'Quiz', culture: 'Culture' };
    html += `<span class="badge badge--${lesson.type || 'theory'}" style="margin-bottom:var(--space-3);display:inline-block">${typeLabels[lesson.type] || lesson.type}</span>`;

    // Description
    if (lesson.description) {
      html += `<p class="content-block content-block--text" style="font-size:1.0625rem;color:var(--text-secondary)">${lesson.description}</p>`;
    }

    // Content blocks
    if (lesson.content?.length) {
      lesson.content.forEach(block => {
        switch (block.type) {
          case 'heading':
            html += `<h2 class="content-block content-block--heading">${block.content || ''}</h2>`;
            break;
          case 'text':
            html += `<p class="content-block content-block--text">${block.content || ''}</p>`;
            break;
          case 'example':
            html += `<div class="content-block content-block--example">
              <p class="example-label">Exemple</p>
              <p class="example-french">${block.french || ''}</p>
              ${block.translation ? `<p class="example-translation">${block.translation}</p>` : ''}
            </div>`;
            break;
          case 'note':
            html += `<div class="content-block content-block--note"><strong>&#128161; Note :</strong> ${block.content || ''}</div>`;
            break;
          case 'warning':
            html += `<div class="content-block content-block--warning"><strong>&#9888; Attention :</strong> ${block.content || ''}</div>`;
            break;
          case 'table':
            html += `<div class="content-block content-block--table">
              <table class="data-table">
                ${block.headers ? `<thead><tr>${block.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>` : ''}
                <tbody>${block.rows?.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') || ''}</tbody>
              </table>
            </div>`;
            break;
          default:
            html += `<div class="content-block">${block.content || ''}</div>`;
        }
      });
    }

    // Vocabulaire
    if (lesson.vocabulary?.length) {
      html += `<div class="vocab-section"><h3>&#128218; Vocabulaire</h3><div class="vocab-list">`;
      lesson.vocabulary.forEach(v => {
        html += `<div class="vocab-item">
          <div class="vocab-term">${v.word || ''}</div>
          <div class="vocab-definition">${v.definition || ''}</div>
          ${v.example ? `<div class="vocab-example">&laquo; ${v.example} &raquo;</div>` : ''}
        </div>`;
      });
      html += `</div></div>`;
    }

    // Grammaire
    if (lesson.grammar?.length) {
      html += `<div class="vocab-section"><h3>&#9997; Grammaire</h3>`;
      lesson.grammar.forEach(g => {
        html += `<div class="content-block content-block--text"><strong>${g.rule || ''}</strong><p>${g.explanation || ''}</p></div>`;
      });
      html += `</div>`;
    }

    // Ressources
    if (lesson.resources?.length) {
      html += `<div class="resources-section"><h3>&#128206; Ressources</h3>`;
      lesson.resources.forEach(r => {
        const icon = r.type === 'pdf' ? '&#128196;' : r.type === 'audio' ? '&#127925;' : r.type === 'video' ? '&#127909;' : '&#128279;';
        html += `<a href="${r.url || '#'}" class="resource-link" target="_blank" rel="noopener"><span>${icon}</span> ${r.title || 'Ressource'}</a>`;
      });
      html += `</div>`;
    }

    contentEl.innerHTML = html;
  }
};

controller.setView(view);

// Event bindings
document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
  sidebar.classList.toggle('lesson-sidebar--open');
});

document.getElementById('btn-prev').addEventListener('click', () => controller.onNavigateLesson('prev'));
document.getElementById('btn-next').addEventListener('click', () => controller.onNavigateLesson('next'));
document.getElementById('btn-prev-footer').addEventListener('click', () => controller.onNavigateLesson('prev'));
document.getElementById('btn-next-footer').addEventListener('click', () => controller.onNavigateLesson('next'));
document.getElementById('btn-complete').addEventListener('click', () => controller.onCompleteLesson());
document.getElementById('btn-complete-footer').addEventListener('click', () => controller.onCompleteLesson());

// Bouton AI Tutor (toolbar) — ouvre le tutor avec le contexte de la lecon courante
document.getElementById('btn-tutor').addEventListener('click', () => {
  const params = new URLSearchParams({
    course: tutorContext.courseId,
    lesson: tutorContext.lessonId,
    lessonTitle: tutorContext.lessonTitle,
    level: tutorContext.cefrLevel
  });
  window.open(`../tutor/tutor.html?${params.toString()}`, '_blank');
});

// Bouton flottant AI Tutor
document.getElementById('btn-tutor-float')?.addEventListener('click', () => {
  const params = new URLSearchParams({
    course: tutorContext.courseId,
    lesson: tutorContext.lessonId,
    lessonTitle: tutorContext.lessonTitle,
    level: tutorContext.cefrLevel
  });
  window.open(`../tutor/tutor.html?${params.toString()}`, '_blank');
});

// Charger le cours
controller.loadCourse(courseId);
