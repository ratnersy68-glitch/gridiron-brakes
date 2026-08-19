const screens = () => document.querySelectorAll('.screen');

export function showScreen(id) {
  screens().forEach((s) => s.classList.toggle('active', s.id === id));
}

export function toast(message) {
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3100);
}

export function wireBackNav(onNavigate) {
  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => onNavigate(btn.dataset.nav));
  });
}
