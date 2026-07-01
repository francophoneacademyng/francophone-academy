import { $ } from './utils.js';

const themeKey = 'fa-theme-mode';
const root = document.documentElement;

export function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem(themeKey, theme);
}

export function getTheme() {
  return localStorage.getItem(themeKey) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export function initTheme() {
  const current = getTheme();
  setTheme(current);
  const toggle = $('#theme-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });
}

export function applyThemeStyles() {
  const theme = getTheme();
  if (theme === 'dark') {
    root.style.setProperty('--color-bg', '#0f172a');
    root.style.setProperty('--color-surface', '#111827');
    root.style.setProperty('--color-surface-strong', '#1f2937');
    root.style.setProperty('--color-text', '#f8fafc');
    root.style.setProperty('--color-muted', '#cbd5e1');
  }
}
