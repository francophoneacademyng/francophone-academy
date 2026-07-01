export function $(selector, context = document) {
  return context.querySelector(selector);
}

export function $all(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

export function createElement(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') element.className = value;
    else if (key === 'text') element.textContent = value;
    else if (key === 'html') element.innerHTML = value;
    else element.setAttribute(key, value);
  });
  children.forEach((child) => {
    if (typeof child === 'string') element.appendChild(document.createTextNode(child));
    else element.appendChild(child);
  });
  return element;
}

export function getCurrentYear() {
  return new Date().getFullYear();
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
