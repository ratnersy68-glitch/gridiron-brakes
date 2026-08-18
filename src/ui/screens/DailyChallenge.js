import { el } from '../dom.js';
import { todayKey } from '../../levels/daily.js';

export function renderDailyChallenge(root, game) {
  const dc = game.save.data.dailyChallenge;
  const today = todayKey();
  const doneToday = dc.lastCompletedDate === today;
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('button', { class: 'btn small close-x interactive', onClick: () => game.ui.showScreen('mainMenu') }, ['✕ Back']));
  screen.appendChild(el('h2', { class: 'title-font' }, ['Daily Challenge']));
  screen.appendChild(el('div', { class: 'panel', style: 'text-align:center; width:min(420px,90vw);' }, [
    el('div', { style: 'font-size:2rem;' }, ['★']),
    el('div', { style: 'margin: 10px 0;' }, [`Streak: ${dc.streak} day${dc.streak === 1 ? '' : 's'}`]),
    el('div', { class: 'small-text', style: 'margin-bottom:16px;' }, [
      doneToday ? "You've already conquered today's run. Come back tomorrow!" : 'A fresh, unique level generated just for today. Beat it to extend your streak.',
    ]),
    el('button', { class: `btn interactive${doneToday ? '' : ' primary'}`, disabled: doneToday, onClick: () => game.startDaily() }, [doneToday ? 'Completed Today' : 'Start Daily Run']),
  ]));
  root.appendChild(screen);
}
