import { initNavbar } from './navbar.js';
import { initTheme, applyThemeStyles } from './theme.js';
import { getCurrentYear, $ } from './utils.js';

export function initLandingPage() {
  applyThemeStyles();
  initTheme();
  initNavbar();

  const yearEl = $('#current-year');
  if (yearEl) {
    yearEl.textContent = getCurrentYear();
  }
}

window.addEventListener('DOMContentLoaded', initLandingPage);
