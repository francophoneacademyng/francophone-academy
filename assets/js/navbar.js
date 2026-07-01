import { $ } from './utils.js';

export function initNavbar() {
  const nav = $('.site-nav-links');
  if (!nav) return;
  const toggle = $('.site-nav-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('site-nav-links--open');
  });
}
