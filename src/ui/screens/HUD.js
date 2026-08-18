import { el, clear, fmtTime } from '../dom.js';

// The live HUD is rebuilt once per level (not per frame) and then patched
// cheaply every frame via update() to avoid DOM-churn during gameplay.
export class HUD {
  constructor(hudRoot, game) {
    this.hudRoot = hudRoot;
    this.game = game;
    this.els = {};
  }

  mount(runtime) {
    clear(this.hudRoot);
    const track = el('div', { class: 'progress-track' }, [el('div', { class: 'progress-fill' })]);
    const attempt = el('div', { class: 'attempt-badge' }, [`Attempt ${runtime.attempts}`]);
    const coinHud = el('div', { class: 'coin-hud' }, runtime.level.coins.map(() => el('div', { class: 'pip' })));
    const pauseBtn = el('button', {
      class: 'btn small interactive', style: 'position:absolute; top:34px; left:14px; pointer-events:auto;',
      onClick: () => this.game.togglePause(),
    }, ['❚❚']);

    this.hudRoot.appendChild(track);
    this.hudRoot.appendChild(attempt);
    this.hudRoot.appendChild(coinHud);
    this.hudRoot.appendChild(pauseBtn);

    if (runtime.practiceMode) {
      const badge = el('div', { class: 'practice-badge' }, ['PRACTICE MODE']);
      this.hudRoot.appendChild(badge);
      this.hudRoot.appendChild(this._practiceControls(runtime));
    }

    this.els = { fill: track.firstChild, attempt, coinPips: [...coinHud.children] };
  }

  _practiceControls(runtime) {
    const wrap = el('div', {
      class: 'row interactive', style: 'position:absolute; bottom:14px; left:50%; transform:translateX(-50%); gap:6px; pointer-events:auto;',
    });
    wrap.appendChild(el('button', { class: 'btn small', onClick: () => runtime.addCheckpoint() }, ['+ Checkpoint']));
    wrap.appendChild(el('button', { class: 'btn small', onClick: () => { runtime.clearCheckpoints(); this.game.ui.toast('Checkpoints cleared'); } }, ['Clear']));
    const cpToggle = el('button', {
      class: 'btn small', onClick: (e) => { runtime.checkpointsEnabled = !runtime.checkpointsEnabled; e.target.textContent = `Checkpoints: ${runtime.checkpointsEnabled ? 'On' : 'Off'}`; },
    }, ['Checkpoints: On']);
    wrap.appendChild(cpToggle);
    const speedBtn = el('button', { class: 'btn small' }, ['Speed: 1x']);
    const speeds = [1, 0.75, 0.5];
    let speedIdx = 0;
    speedBtn.addEventListener('click', () => {
      speedIdx = (speedIdx + 1) % speeds.length;
      runtime.setSpeedScale(speeds[speedIdx]);
      speedBtn.textContent = `Speed: ${speeds[speedIdx]}x`;
    });
    wrap.appendChild(speedBtn);
    wrap.appendChild(el('button', { class: 'btn small danger', onClick: () => this.game.exitToMenu() }, ['Exit']));
    return wrap;
  }

  update(runtime) {
    if (!this.els.fill) return;
    this.els.fill.style.width = `${runtime.percent}%`;
    this.els.attempt.textContent = `Attempt ${runtime.attempts}`;
    runtime.level.coins.forEach((c, i) => {
      const pip = this.els.coinPips[i];
      if (pip) pip.classList.toggle('on', !!c.collected);
    });
  }

  unmount() { clear(this.hudRoot); this.els = {}; }
}

export function buildPauseOverlay(game, runtime) {
  const wrap = el('div', { class: 'overlay-center interactive' });
  wrap.appendChild(el('div', { class: 'panel', style: 'text-align:center;' }, [
    el('h2', { class: 'title-font' }, ['Paused']),
    el('div', { class: 'menu-list' }, [
      el('button', { class: 'btn primary interactive', onClick: () => game.togglePause() }, ['Resume']),
      el('button', { class: 'btn interactive', onClick: () => game.restartLevel() }, ['Restart']),
      el('button', { class: 'btn interactive', onClick: () => game.exitToMenu() }, ['Exit to Menu']),
    ]),
  ]));
  return wrap;
}

export function buildCompleteOverlay(game, payload) {
  const wrap = el('div', { class: 'overlay-center interactive' });
  const meta = game.currentMeta;
  const isEditorTest = typeof game.currentLevelId === 'string' && game.currentLevelId.startsWith('custom_');
  wrap.appendChild(el('div', { class: 'panel', style: 'text-align:center; min-width:300px;' }, [
    el('h2', { class: 'title-font', style: 'color:var(--accent);' }, ['Level Complete!']),
    el('div', { style: 'margin: 8px 0;' }, [meta?.name || payload.levelId]),
    el('div', { class: 'row', style: 'justify-content:center; gap:18px; margin:14px 0;' }, [
      stat('Time', fmtTime(payload.timeMs)),
      stat('Deaths', payload.deaths),
      stat('Coins', `${payload.coinsCollected}/${payload.totalCoins}`),
    ]),
    payload.reward ? el('div', { class: 'small-text', style: 'margin-bottom:12px;' }, [`+${payload.reward.xp} XP  ·  +◆${payload.reward.currency}`]) : null,
    el('div', { class: 'menu-list' }, isEditorTest ? [
      el('button', { class: 'btn primary interactive', onClick: () => game.returnToEditorFromTest() }, ['Back to Editor']),
    ] : [
      game.hasNextLevel() ? el('button', { class: 'btn primary interactive', onClick: () => game.startLevel(game.nextLevelId()) }, ['Next Level']) : null,
      el('button', { class: 'btn interactive', onClick: () => game.restartLevel() }, ['Retry']),
      el('button', { class: 'btn interactive', onClick: () => game.ui.showScreen('levelSelect') }, ['Level Select']),
      el('button', { class: 'btn interactive', onClick: () => game.exitToMenu() }, ['Main Menu']),
    ].filter(Boolean)),
  ]));
  return wrap;
}

function stat(label, value) {
  return el('div', { style: 'text-align:center;' }, [
    el('div', { style: 'font-family:Orbitron; font-size:1.2rem;' }, [String(value)]),
    el('div', { class: 'small-text' }, [label]),
  ]);
}
