/**
 * courses.js — Page Catalogue de cours
 */

import { AuthController } from '../../src/controllers/AuthController.js';
import { CourseController } from '../../src/controllers/CourseController.js';
import { CurriculumView } from '../../src/views/CurriculumView.js';

// Auth Guard
if (!AuthController.isAuthenticated()) {
  window.location.href = '../login/login.html';
}

// User name
const user = AuthController.getCurrentUser();
if (user?.displayName) {
  document.getElementById('user-name').textContent = user.displayName;
}

// Controller + View
const controller = new CourseController();

// Container
const container = document.getElementById('courses-grid');

// View custom inline pour le catalogue
const view = {
  renderLoading: (msg) => {
    container.innerHTML = `<div class="loading-state" style="grid-column:1/-1"><div class="loading-spinner"></div><p>${msg}</p></div>`;
  },
  renderError: (msg, retryFn) => {
    container.innerHTML = `<div class="error-state" style="grid-column:1/-1"><div class="error-icon">&#9888;</div><p>${msg}</p>${retryFn ? '<button class="btn btn--primary" onclick="location.reload()">Reessayer</button>' : ''}</div>`;
  },
  showToast: (message, type = 'info', duration = 3000) => {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  setLoading: (loading) => {
    document.querySelectorAll('.course-card__enroll').forEach(btn => {
      btn.disabled = loading;
      btn.classList.toggle('btn--loading', loading);
    });
  },
  renderCourses: (courses) => {
    if (courses.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">&#128218;</div><p>Aucun cours disponible pour le moment.</p></div>';
      return;
    }

    container.innerHTML = courses.map(course => {
      const priceDisplay = course.price === 0
        ? '<span class="course-card__price course-card__price--free">Gratuit</span>'
        : `<span class="course-card__price">${course.price.toLocaleString()} ${course.currency}</span>`;

      const objectivesHtml = (course.objectives || []).map(obj =>
        `<li>${obj}</li>`
      ).join('');

      const categoryIcons = {
        general: '&#128218;', professional: '&#128188;', delf: '&#127891;',
        dalf: '&#127891;', tcf: '&#127758;', tef: '&#127891;'
      };

      return `
        <article class="course-card" data-course-id="${course.id}">
          <div class="course-card__image">
            <span aria-hidden="true">${categoryIcons[course.category] || '&#128218;'}</span>
            <span class="badge badge--${course.level?.toLowerCase()}">${course.level}</span>
          </div>
          <div class="course-card__body">
            <span class="course-card__category">${course.getCategoryLabel ? course.getCategoryLabel() : course.category}</span>
            <h3 class="course-card__title">${course.title}</h3>
            <p class="course-card__description">${course.shortDescription || course.description}</p>
            <div class="course-card__meta">
              <span>&#9201; ${course.getFormattedDuration ? course.getFormattedDuration() : course.duration + ' min'}</span>
              <span>&#128218; ${course.moduleCount || 0} modules</span>
              <span>&#127919; ${course.lessonCount || 0} lecons</span>
            </div>
            ${objectivesHtml ? `<div class="course-card__objectives"><h4>Objectifs</h4><ul>${objectivesHtml}</ul></div>` : ''}
            <div class="course-card__footer">
              ${priceDisplay}
              <button class="btn btn--primary course-card__enroll" data-action="enroll" data-course-id="${course.id}">Commencer</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Bind events
    container.querySelectorAll('[data-action="enroll"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const courseId = e.currentTarget.dataset.courseId;
        controller.onEnroll(courseId);
      });
    });
  }
};

controller.setView(view);

// Filtres
document.getElementById('category-filters').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  document.querySelectorAll('#category-filters .btn').forEach(b => {
    b.classList.remove('btn--primary');
    b.classList.add('btn--outline');
  });
  btn.classList.remove('btn--outline');
  btn.classList.add('btn--primary');

  const filter = btn.dataset.filter;
  if (filter === 'all') controller.loadCatalog();
  else controller.filterByCategory(filter);
});

document.getElementById('level-filters').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-level]');
  if (!btn) return;
  document.querySelectorAll('#level-filters .btn').forEach(b => {
    b.classList.remove('btn--primary');
    b.classList.add('btn--outline');
  });
  btn.classList.remove('btn--outline');
  btn.classList.add('btn--primary');

  const level = btn.dataset.level;
  if (level === 'all') controller.loadCatalog();
  else controller.filterByLevel(level);
});

// Sidebar mobile
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

// Charger
controller.loadCatalog();
