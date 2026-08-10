const COLORS = ['#e8a33d', '#4b92db', '#ff4d6d', '#4caf50', '#a259ff', '#ffb100', '#00e5ff', '#ffffff'];

export function burstConfetti(count = 80) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const left = Math.random() * 100;
    const dur = 1.6 + Math.random() * 1.4;
    const delay = Math.random() * 0.3;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    piece.style.left = `${left}vw`;
    piece.style.background = color;
    piece.style.animationDuration = `${dur}s`;
    piece.style.animationDelay = `${delay}s`;
    piece.style.borderRadius = Math.random() < 0.5 ? '50%' : '2px';
    frag.appendChild(piece);
    setTimeout(() => piece.remove(), (dur + delay) * 1000 + 200);
  }
  document.body.appendChild(frag);
}
