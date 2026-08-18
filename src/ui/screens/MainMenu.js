import { el } from '../dom.js';

export function renderMainMenu(root, game) {
  const d = game.save.data;
  root.appendChild(el('div', { class: 'screen' }, [
    el('div', { class: 'topbar' }, [
      el('div', { class: 'row' }, [
        el('div', { class: 'currency-badge' }, [`◆ ${d.currency}`]),
        el('div', { class: 'xp-badge' }, [`LV ${d.playerLevel} · ${d.xp}/${xpNeeded(d.playerLevel)} XP`]),
      ]),
    ]),
    el('h1', { class: 'game-title' }, ['PRISM RUSH']),
    el('div', { class: 'subtitle' }, ['an original rhythm platformer']),
    el('div', { class: 'menu-list' }, [
      btn('▶  Play', 'primary', () => game.startNextIncomplete()),
      btn('☰  Level Select', null, () => game.ui.showScreen('levelSelect')),
      btn('⏱  Practice Mode', null, () => game.ui.showScreen('practiceSetup')),
      btn('★  Daily Challenge', null, () => game.ui.showScreen('daily')),
      btn('✎  Editor', null, () => game.openEditor()),
      btn('◆  Shop', null, () => game.ui.showScreen('shop')),
      btn('⚙  Settings', null, () => game.ui.showScreen('settings')),
      btn('🏆  Achievements', null, () => game.ui.showScreen('achievements')),
      btn('▤  Statistics', null, () => game.ui.showScreen('statistics')),
    ]),
    el('div', { class: 'hint' }, ['Tap / Click / Space to jump · Esc to pause']),
  ]));
}

function xpNeeded(level) { return Math.round(90 * Math.pow(level, 1.35)); }

function btn(label, variant, onClick) {
  return el('button', { class: `btn interactive${variant ? ' ' + variant : ''}`, onClick: () => { onClick(); } }, [label]);
}
