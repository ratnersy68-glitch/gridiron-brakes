const root = () => document.getElementById('toast-root');
const MAX_VISIBLE = 3;

export function showToast({ text, kind = 'default', duration = 3200 }) {
  const container = root();
  // Keep the stack shallow (matters most on phones): drop oldest first.
  while (container.children.length >= MAX_VISIBLE) {
    container.firstElementChild.remove();
  }
  const el = document.createElement('div');
  el.className = `toast toast-enter ${kind}`;
  el.textContent = text;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateX(30px)';
    setTimeout(() => el.remove(), 320);
  }, duration);
}
