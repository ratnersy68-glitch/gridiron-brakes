import { el } from '../dom.js';
import { LEVEL_META } from '../../levels/levelList.js';

export function renderPracticeSetup(root, game) {
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('button', { class: 'btn small close-x interactive', onClick: () => game.ui.showScreen('mainMenu') }, ['✕ Back']));
  screen.appendChild(el('h2', { class: 'title-font' }, ['Practice Mode']));
  screen.appendChild(el('div', { class: 'hint', style: 'max-width:520px; text-align:center;' }, [
    'Place checkpoints, slow the game down, and drill tricky sections. Practice runs never count toward level completion or best times.',
  ]));

  const grid = el('div', { class: 'level-grid' });
  for (const meta of LEVEL_META) {
    grid.appendChild(el('div', {
      class: 'level-card interactive', style: `border-left:4px solid ${meta.theme.accent}`,
      onClick: () => game.startLevel(meta.id, { practice: true }),
    }, [
      el('div', { class: 'lname' }, [`${meta.id}. ${meta.name}`]),
      el('div', { class: 'small-text' }, [`${meta.category} · ${'★'.repeat(Math.min(meta.difficulty, 10))}`]),
    ]));
  }
  screen.appendChild(grid);
  root.appendChild(screen);
}
