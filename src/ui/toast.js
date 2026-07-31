const root = () => document.getElementById('toast-root');

export function showToast({ text, kind = 'default', duration = 3200 }) {
  const el = document.createElement('div');
  el.className = `toast toast-enter ${kind}`;
  el.textContent = text;
  root().appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateX(30px)';
    setTimeout(() => el.remove(), 320);
  }, duration);
}
