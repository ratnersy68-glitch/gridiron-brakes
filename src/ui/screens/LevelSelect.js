import { el, clear, fmtTime } from '../dom.js';
import { LEVEL_META, CATEGORIES } from '../../levels/levelList.js';

let activeFilter = 'All';
let sortMode = 'id';

export function renderLevelSelect(root, game) {
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('button', { class: 'btn small close-x interactive', onClick: () => game.ui.showScreen('mainMenu') }, ['✕ Back']));
  screen.appendChild(el('h2', { class: 'title-font' }, ['Level Select']));

  const filterBar = el('div', { class: 'filter-bar' });
  const cats = ['All', ...CATEGORIES];
  for (const c of cats) {
    filterBar.appendChild(el('div', {
      class: `chip interactive${activeFilter === c ? ' active' : ''}`,
      onClick: () => { activeFilter = c; game.ui.refresh(); },
    }, [c]));
  }
  const sortChip = el('div', {
    class: 'chip interactive',
    onClick: () => { sortMode = sortMode === 'id' ? 'progress' : 'id'; game.ui.refresh(); },
  }, [sortMode === 'id' ? 'Sort: Level #' : 'Sort: Progress']);
  filterBar.appendChild(sortChip);
  screen.appendChild(filterBar);

  const grid = el('div', { class: 'level-grid' });
  let levels = activeFilter === 'All' ? LEVEL_META : LEVEL_META.filter((l) => l.category === activeFilter);
  levels = [...levels];
  if (sortMode === 'progress') levels.sort((a, b) => (game.save.getLevelProgress(b.id).bestPercent) - (game.save.getLevelProgress(a.id).bestPercent));
  else levels.sort((a, b) => a.id - b.id);

  for (const meta of levels) grid.appendChild(levelCard(meta, game));
  screen.appendChild(grid);
  root.appendChild(screen);
}

function levelCard(meta, game) {
  const prog = game.save.getLevelProgress(meta.id);
  const stars = '★'.repeat(meta.difficulty) + '☆'.repeat(10 - meta.difficulty);
  const card = el('div', {
    class: 'level-card interactive',
    style: `border-left: 4px solid ${meta.theme.accent}`,
    onClick: () => game.startLevel(meta.id),
  }, [
    el('div', { class: 'lname' }, [`${meta.id}. ${meta.name}`]),
    el('div', { class: 'small-text' }, [meta.category]),
    el('div', { class: 'stars', style: 'font-size:0.7rem;' }, [stars.slice(0, 10)]),
    el('div', { class: 'row', style: 'margin-top:6px;' }, coinPips(prog.coins)),
    el('div', { class: 'progress-bar' }, [el('div', { style: `width:${prog.bestPercent}%` })]),
    el('div', { class: 'lmeta' }, [
      el('span', {}, [`Best: ${Math.floor(prog.bestPercent)}%`]),
      el('span', {}, [prog.completed ? `✓ ${fmtTime(prog.bestTimeMs)}` : `${prog.attempts} tries`]),
    ]),
  ]);
  return card;
}

function coinPips(coins) {
  return coins.map((on) => el('span', { style: `color:${on ? '#ffd23b' : 'rgba(255,255,255,0.15)'}; margin-right:3px;` }, ['●']));
}
