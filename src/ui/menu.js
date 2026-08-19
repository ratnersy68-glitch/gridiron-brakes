import { MODES, MODE_LIST } from '../data/modes.js';
import { DIFFICULTIES } from '../data/difficulty.js';
import { GOALIE_PERSONALITIES } from '../data/goalies.js';
import { ARENAS, getArena } from '../data/arenas.js';
import { CHALLENGES } from '../data/challenges.js';

export const selection = {
  modeId: 'classic',
  difficultyId: 'rookie',
  goalieId: 'wall',
  arenaId: 'localrink',
};

function optionButton(container, { label, sub, locked, selected, onClick, badge }) {
  const btn = document.createElement('button');
  btn.className = 'option-btn' + (locked ? ' locked' : '') + (selected ? ' selected' : '');
  btn.innerHTML = `<span>${label}${sub ? ` <small>${sub}</small>` : ''}</span>${badge ? `<span class="boss-tag">${badge}</span>` : ''}`;
  if (!locked) btn.addEventListener('click', onClick);
  container.appendChild(btn);
  return btn;
}

export function initModeSelect(profile, { onStart }) {
  const modeList = document.getElementById('mode-list');
  const diffList = document.getElementById('difficulty-list');
  const goalieList = document.getElementById('goalie-list');
  const arenaList = document.getElementById('arena-list');
  const diffHint = document.getElementById('difficulty-hint');
  const goalieHint = document.getElementById('goalie-hint');

  selection.difficultyId = profile.settings.difficulty || 'rookie';
  selection.arenaId = profile.unlockedArenas.includes(profile.lastArena) ? profile.lastArena : 'localrink';

  function renderModes() {
    modeList.innerHTML = '';
    MODE_LIST.forEach((id) => {
      const m = MODES[id];
      optionButton(modeList, {
        label: m.name, selected: selection.modeId === id,
        onClick: () => { selection.modeId = id; renderModes(); },
      });
    });
  }

  function renderDifficulty() {
    diffList.innerHTML = '';
    DIFFICULTIES.forEach((d) => {
      optionButton(diffList, {
        label: d.name, selected: selection.difficultyId === d.id,
        onClick: () => { selection.difficultyId = d.id; renderDifficulty(); updateHints(); },
      });
    });
    updateHints();
  }

  function renderGoalies() {
    goalieList.innerHTML = '';
    GOALIE_PERSONALITIES.filter((g) => !g.boss).forEach((g) => {
      optionButton(goalieList, {
        label: g.name, selected: selection.goalieId === g.id,
        onClick: () => { selection.goalieId = g.id; renderGoalies(); updateHints(); },
      });
    });
    updateHints();
  }

  function renderArenas() {
    arenaList.innerHTML = '';
    ARENAS.forEach((a) => {
      const locked = !profile.unlockedArenas.includes(a.id);
      optionButton(arenaList, {
        label: a.name, sub: locked ? `Lv ${a.unlockLevel}` : '', locked,
        selected: selection.arenaId === a.id,
        onClick: () => { selection.arenaId = a.id; renderArenas(); },
      });
    });
  }

  function updateHints() {
    const d = DIFFICULTIES.find((x) => x.id === selection.difficultyId);
    diffHint.textContent = `Reaction window: ${Math.round(d.perfectWindow * 1000)}ms · reads you ${Math.round(d.readAccuracy * 100)}% accurately`;
    const g = GOALIE_PERSONALITIES.find((x) => x.id === selection.goalieId);
    goalieHint.textContent = g ? g.tag : '';
  }

  renderModes(); renderDifficulty(); renderGoalies(); renderArenas();

  document.getElementById('btn-start-shootout').onclick = () => {
    onStart({ ...selection });
  };
}

export function quickplayConfig(profile) {
  return {
    modeId: 'classic',
    difficultyId: profile.settings.difficulty || 'rookie',
    goalieId: 'scrambler',
    arenaId: profile.unlockedArenas.includes(profile.lastArena) ? profile.lastArena : 'localrink',
  };
}

export function initChallenges(profile, { onStart }) {
  const grid = document.getElementById('challenge-grid');
  function render() {
    grid.innerHTML = '';
    CHALLENGES.forEach((c) => {
      const locked = profile.level < c.unlockLevel;
      const done = profile.stats.challengesCompleted.includes(c.id);
      const card = document.createElement('div');
      card.className = 'challenge-card' + (locked ? ' locked' : '') + (done ? ' done' : '');
      const arenaName = getArena(profile.lastArena).name;
      card.innerHTML = `
        <h4>${c.name} ${c.boss ? '<span class="boss-tag">BOSS</span>' : ''}${done ? ' ✅' : ''}</h4>
        <p>${c.desc}</p>
        <div class="challenge-meta"><span>${DIFFICULTIES.find(d=>d.id===c.difficultyId).name}</span><span>vs ${GOALIE_PERSONALITIES.find(g=>g.id===c.goalieId).name}</span></div>
      `;
      if (locked) {
        const p = document.createElement('p');
        p.className = 'item-locked-label';
        p.textContent = `Unlocks at level ${c.unlockLevel}`;
        card.appendChild(p);
      } else {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.textContent = done ? 'Play Again' : 'Start Challenge';
        btn.onclick = () => onStart(c.id);
        card.appendChild(btn);
      }
      grid.appendChild(card);
    });
  }
  render();
  return render;
}
