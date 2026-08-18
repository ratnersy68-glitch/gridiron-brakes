import { el } from '../dom.js';
import { ACHIEVEMENT_LIST } from '../../achievements/Achievements.js';

export function renderAchievements(root, game) {
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('button', { class: 'btn small close-x interactive', onClick: () => game.ui.showScreen('mainMenu') }, ['✕ Back']));
  const unlockedCount = ACHIEVEMENT_LIST.filter((a) => game.save.data.achievements[a.id]?.unlocked).length;
  screen.appendChild(el('h2', { class: 'title-font' }, [`Achievements (${unlockedCount}/${ACHIEVEMENT_LIST.length})`]));

  const list = el('div', { class: 'ach-list' });
  for (const a of ACHIEVEMENT_LIST) {
    const rec = game.save.data.achievements[a.id];
    const unlocked = !!rec?.unlocked;
    list.appendChild(el('div', { class: `ach-item${unlocked ? '' : ' locked'}` }, [
      el('div', {}, [
        el('div', { style: 'font-weight:700;' }, [unlocked ? '🏆 ' + a.name : '🔒 ' + a.name]),
        el('div', { class: 'small-text' }, [a.desc]),
      ]),
      el('div', { class: 'small-text', style: 'text-align:right; white-space:nowrap;' }, [
        a.reward.xp ? `${a.reward.xp} XP` : '', a.reward.currency ? ` ◆${a.reward.currency}` : '',
      ]),
    ]));
  }
  screen.appendChild(list);
  root.appendChild(screen);
}
