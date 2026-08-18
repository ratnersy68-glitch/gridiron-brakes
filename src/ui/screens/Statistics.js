import { el, fmtDuration } from '../dom.js';
import { getLevelMeta } from '../../levels/levelList.js';

export function renderStatistics(root, game) {
  const s = game.save.data.stats;
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('button', { class: 'btn small close-x interactive', onClick: () => game.ui.showScreen('mainMenu') }, ['✕ Back']));
  screen.appendChild(el('h2', { class: 'title-font' }, ['Statistics']));

  const rows = [
    ['Total Attempts', s.totalAttempts],
    ['Total Deaths', s.totalDeaths],
    ['Levels Completed', `${s.levelsCompleted} / 50`],
    ['Coins Collected', s.coinsCollected],
    ['Total Playtime', fmtDuration(s.totalPlaytimeMs)],
    ['Total Jumps', s.totalJumps],
    ['Total Distance', `${Math.floor(s.totalDistance).toLocaleString()} units`],
    ['Best Level', s.bestLevelId ? getLevelMeta(s.bestLevelId)?.name : '—'],
    ['Hardest Level Completed', s.hardestLevelCompleted ? `${getLevelMeta(s.hardestLevelCompleted)?.name} (${getLevelMeta(s.hardestLevelCompleted)?.category})` : '—'],
    ['Practice Sessions', s.practiceSessions],
    ['Player Level', game.save.data.playerLevel],
    ['Currency Earned', game.save.data.currency],
  ];
  const list = el('div', { class: 'stat-list panel' });
  for (const [label, value] of rows) list.appendChild(el('div', { class: 'stat-row' }, [el('span', {}, [label]), el('span', { style: 'font-weight:700;' }, [String(value)])]));
  screen.appendChild(list);
  root.appendChild(screen);
}
