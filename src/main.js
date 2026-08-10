import { Game } from './game.js';
import { listSlots, saveSlot, loadSlot, nextFreeSlotId, deleteSlot, getLastSlotId } from './systems/save.js';
import { renderShell } from './ui/shell.js';
import { renderHome } from './ui/screens/home.js';
import { renderBoxShop } from './ui/screens/boxShop.js';
import { renderOpening } from './ui/screens/opening.js';
import { renderBinder } from './ui/screens/binder.js';
import { renderMarketplace } from './ui/screens/marketplace.js';
import { renderShopJob } from './ui/screens/shopJob.js';
import { renderStore } from './ui/screens/store.js';
import { renderVault } from './ui/screens/vault.js';
import { renderAchievements } from './ui/screens/achievements.js';
import { renderSettings } from './ui/screens/settings.js';

const app = document.getElementById('app');

// A blank screen tells the player nothing. Surface any uncaught failure so a
// bad state is reportable instead of silently fatal.
function showFatalError(err) {
  const detail = (err && (err.stack || err.message)) || String(err);
  app.innerHTML = `
    <div class="title-screen">
      <h1>🏈 Gridiron Breaks</h1>
      <p>Something went wrong while loading the game.</p>
      <pre style="max-width:min(90vw,640px);overflow:auto;text-align:left;background:var(--bg-2);
                  border:1px solid var(--border);border-radius:10px;padding:12px;font-size:11px;">${
        detail.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))
      }</pre>
    </div>`;
}
window.addEventListener('error', (e) => { if (!app.childElementCount) showFatalError(e.error || e.message); });
window.addEventListener('unhandledrejection', (e) => { if (!app.childElementCount) showFatalError(e.reason); });

const SCREEN_RENDERERS = {
  home: renderHome,
  boxes: renderBoxShop,
  opening: renderOpening,
  binder: renderBinder,
  marketplace: renderMarketplace,
  shopjob: renderShopJob,
  store: renderStore,
  vault: renderVault,
  achievements: renderAchievements,
  settings: renderSettings,
};

function mountGame(game) {
  game.goToTitle = () => { game.save(); renderTitleScreen(); };
  game.onChange(() => renderShell(app, game, SCREEN_RENDERERS));
  renderShell(app, game, SCREEN_RENDERERS);
  game.startAutosave();
  window.addEventListener('beforeunload', () => game.save());
}

function renderTitleScreen() {
  app.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'title-screen fade-in';

  const h1 = document.createElement('h1');
  h1.textContent = '🏈 Gridiron Breaks';
  wrap.appendChild(h1);

  const p = document.createElement('p');
  p.textContent = 'Crack boxes, chase legends, build the greatest fictional football card collection ever assembled — and turn your last $100 into an empire.';
  wrap.appendChild(p);

  const slots = listSlots();
  const slotList = document.createElement('div');
  slotList.className = 'slot-list';

  if (slots.length) {
    const label = document.createElement('div');
    label.className = 'muted';
    label.textContent = 'Continue a save:';
    slotList.appendChild(label);
    slots.forEach(slot => {
      const row = document.createElement('div');
      row.className = 'slot-row';
      const info = document.createElement('div');
      info.innerHTML = `<div style="font-weight:700;">${slot.name}</div><div class="muted" style="font-size:12px;">Day ${slot.day} • $${Math.round(slot.cash).toLocaleString()}</div>`;
      row.appendChild(info);
      const btnGroup = document.createElement('div');
      btnGroup.className = 'flex gap-8';
      const continueBtn = document.createElement('button');
      continueBtn.className = 'btn btn-primary btn-sm';
      continueBtn.textContent = 'Continue';
      continueBtn.addEventListener('click', () => mountGame(Game.fromSave(loadSlot(slot.id))));
      btnGroup.appendChild(continueBtn);
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger btn-sm';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Delete save "${slot.name}"?`)) { deleteSlot(slot.id); renderTitleScreen(); }
      });
      btnGroup.appendChild(deleteBtn);
      row.appendChild(btnGroup);
      slotList.appendChild(row);
    });
  }

  const newGameRow = document.createElement('div');
  newGameRow.className = 'flex gap-8';
  newGameRow.style.marginTop = '10px';
  const nameInput = document.createElement('input');
  nameInput.placeholder = 'Collector name';
  nameInput.value = 'Rookie Collector';
  nameInput.className = 'btn';
  nameInput.style.textAlign = 'left';
  newGameRow.appendChild(nameInput);
  const newGameBtn = document.createElement('button');
  newGameBtn.className = 'btn btn-gold';
  newGameBtn.textContent = '+ New Collector ($100 start)';
  newGameBtn.addEventListener('click', () => {
    const slotId = nextFreeSlotId();
    const game = Game.fromNew(slotId, nameInput.value.trim() || 'Rookie Collector');
    saveSlot(slotId, game.state);
    mountGame(game);
  });
  newGameRow.appendChild(newGameBtn);
  slotList.appendChild(newGameRow);

  wrap.appendChild(slotList);
  app.appendChild(wrap);
}

renderTitleScreen();
