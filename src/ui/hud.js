import { SHOT_TYPES, SHOT_ORDER } from '../data/shots.js';

let shotTypeButtons = [];
let touchShotTypeButtons = [];

export function initShotTypeBar(input) {
  const bar = document.getElementById('shot-type-bar');
  const touchBar = document.getElementById('touch-shot-types');
  bar.innerHTML = ''; touchBar.innerHTML = '';
  shotTypeButtons = []; touchShotTypeButtons = [];

  SHOT_ORDER.forEach((id) => {
    const s = SHOT_TYPES[id];
    const btn = document.createElement('button');
    btn.className = 'shot-type-btn' + (input.shotType === id ? ' active' : '');
    btn.textContent = `${s.key} ${s.name}`;
    btn.title = s.desc;
    btn.addEventListener('click', () => input.setShotType(id));
    bar.appendChild(btn);
    shotTypeButtons.push({ id, el: btn });

    const tbtn = document.createElement('button');
    tbtn.textContent = s.name.split(' ')[0];
    tbtn.className = input.shotType === id ? 'active' : '';
    tbtn.addEventListener('click', () => input.setShotType(id));
    touchBar.appendChild(tbtn);
    touchShotTypeButtons.push({ id, el: tbtn });
  });

  document.getElementById('touch-special-btn').addEventListener('click', () => input.triggerSpecial());

  input.onShotTypeChange = (id) => {
    shotTypeButtons.forEach((b) => b.el.classList.toggle('active', b.id === id));
    touchShotTypeButtons.forEach((b) => b.el.classList.toggle('active', b.id === id));
  };
}

export function setHudActive(active) {
  document.getElementById('hud').classList.toggle('active', active);
  const touch = isTouchDevice();
  document.getElementById('touch-controls').classList.toggle('active', active && touch);
  document.getElementById('shot-type-bar').style.display = touch ? 'none' : '';
  document.getElementById('special-hint').style.display = touch ? 'none' : '';
}

export function isTouchDevice() {
  return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

export function setModeLabel(text) { document.getElementById('hud-mode-label').textContent = text; }
export function setScore(text) { document.getElementById('hud-score').textContent = text; }
export function setPrompt(text) { document.getElementById('hud-prompt').textContent = text; }
export function setChallengeLabel(text) { document.getElementById('hud-challenge').textContent = text; }

export function updatePowerMeter({ active, fill, sweetStart, sweetEnd }) {
  const wrap = document.getElementById('power-meter-wrap');
  wrap.style.opacity = active ? '1' : '0.35';
  document.getElementById('power-fill').style.width = `${Math.min(100, Math.max(0, fill * 100))}%`;
  const sweet = document.getElementById('power-sweet');
  sweet.style.left = `${sweetStart * 100}%`;
  sweet.style.width = `${(sweetEnd - sweetStart) * 100}%`;
}

let bannerTimer = null;
export function showResultBanner(text, sub, cls) {
  const banner = document.getElementById('result-banner');
  const t = document.getElementById('result-banner-text');
  const s = document.getElementById('result-banner-sub');
  t.textContent = text; t.className = 'result-banner-text' + (cls ? ` ${cls}` : '');
  s.textContent = sub || '';
  banner.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => banner.classList.remove('show'), 1900);
}

let opponentTimer = null;
export function showOpponentBanner(text) {
  const banner = document.getElementById('opponent-banner');
  document.getElementById('opponent-banner-text').textContent = text;
  banner.classList.add('show');
  clearTimeout(opponentTimer);
  opponentTimer = setTimeout(() => banner.classList.remove('show'), 1300);
  return new Promise((res) => setTimeout(res, 1300));
}

export function renderResults(data, { onAgain, onMenu }) {
  document.getElementById('results-title').textContent = data.title;
  const stats = document.getElementById('results-stats');
  stats.innerHTML = data.stats.map(([num, lbl]) => `
    <div class="stat"><span class="num">${num}</span><span class="lbl">${lbl}</span></div>
  `).join('');
  document.getElementById('results-rewards').textContent = data.rewards;
  document.getElementById('btn-results-again').onclick = onAgain;
  document.getElementById('btn-results-menu').onclick = onMenu;
}
