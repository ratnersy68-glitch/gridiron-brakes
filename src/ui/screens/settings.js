import { setSoundEnabled, isSoundEnabled, sfx } from '../../systems/sound.js';
import { deleteSlot } from '../../systems/save.js';
import { money } from '../../utils/format.js';

export function renderSettings(container, game) {
  const s = game.state;
  const wrap = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'panel';
  header.innerHTML = `<div class="panel-title">Settings</div>
    <div class="muted">Save slot: ${s.name} (${s.slotId})</div>`;
  wrap.appendChild(header);

  const soundPanel = document.createElement('div');
  soundPanel.className = 'panel';
  soundPanel.innerHTML = `<div class="panel-title">Audio</div>`;
  const soundBtn = document.createElement('button');
  soundBtn.className = 'btn';
  soundBtn.textContent = isSoundEnabled() ? '🔊 Sound On' : '🔇 Sound Off';
  soundBtn.addEventListener('click', () => {
    const next = !isSoundEnabled();
    setSoundEnabled(next);
    s.settings.soundOn = next;
    if (next) sfx.click();
    soundBtn.textContent = next ? '🔊 Sound On' : '🔇 Sound Off';
  });
  soundPanel.appendChild(soundBtn);
  wrap.appendChild(soundPanel);

  const savePanel = document.createElement('div');
  savePanel.className = 'panel';
  savePanel.innerHTML = `<div class="panel-title">Save Data</div>`;
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Save Now';
  saveBtn.addEventListener('click', () => { game.save(); saveBtn.textContent = 'Saved!'; setTimeout(() => saveBtn.textContent = 'Save Now', 1200); });
  savePanel.appendChild(saveBtn);

  const titleBtn = document.createElement('button');
  titleBtn.className = 'btn btn-ghost';
  titleBtn.style.marginLeft = '8px';
  titleBtn.textContent = 'Switch Save Slot';
  titleBtn.addEventListener('click', () => { game.save(); game.goToTitle(); });
  savePanel.appendChild(titleBtn);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-danger';
  resetBtn.style.marginLeft = '8px';
  resetBtn.textContent = 'Delete This Save';
  resetBtn.addEventListener('click', () => {
    if (confirm('Delete this save permanently? This cannot be undone.')) {
      deleteSlot(s.slotId);
      game.goToTitle();
    }
  });
  savePanel.appendChild(resetBtn);
  wrap.appendChild(savePanel);

  const aboutPanel = document.createElement('div');
  aboutPanel.className = 'panel';
  aboutPanel.innerHTML = `<div class="panel-title">About</div>
    <div class="muted">Gridiron Breaks — a fictional football trading card collecting sim. All players, teams, and brands are wholly original.</div>
    <div class="muted mt-8">Lifetime earned: ${money(s.stats.totalMoneyEarned)} • Lifetime spent: ${money(s.stats.totalMoneySpent)}</div>`;
  wrap.appendChild(aboutPanel);

  container.appendChild(wrap);
}
