import { UPGRADE_DEFS, MAX_LEVEL, upgradeCost, totalPassiveIncomePerDay } from '../../systems/playerStore.js';
import { money } from '../../utils/format.js';

export function renderStore(container, game) {
  const s = game.state;
  const wrap = document.createElement('div');

  if (s.shop.careerStage < 4) {
    const locked = document.createElement('div');
    locked.className = 'panel';
    locked.innerHTML = `<div class="panel-title">My Store</div>
      <div class="empty-state">You need to own the shop first. Keep working shifts and save up for the buyout in the Card Shop tab.</div>`;
    wrap.appendChild(locked);
    container.appendChild(wrap);
    return;
  }

  const header = document.createElement('div');
  header.className = 'panel';
  header.innerHTML = `<div class="panel-title">My Store <span class="sub">Passive income: ${money(totalPassiveIncomePerDay(s))}/day</span></div>
    <div class="muted">Upgrades pay out automatically each time you advance the day.</div>`;
  wrap.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-3 mt-16';
  UPGRADE_DEFS.forEach(def => {
    const level = s.store.upgrades[def.key] || 0;
    const card = document.createElement('div');
    card.className = 'box-card';
    const maxed = level >= MAX_LEVEL;
    const cost = maxed ? null : upgradeCost(def.key, level);
    card.innerHTML = `<div class="box-name">${def.label}</div>
      <div class="box-blurb">${def.blurb}</div>
      <div class="box-meta">Level ${level} / ${MAX_LEVEL} • +${def.perLevelIncome}/day per level</div>
      <div class="price">${maxed ? 'MAXED' : money(cost)}</div>`;
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-block';
    btn.textContent = maxed ? 'Maxed Out' : `Upgrade to Level ${level + 1}`;
    btn.disabled = maxed || s.cash < cost;
    btn.addEventListener('click', () => { game.purchaseUpgrade(def.key); rerender(); });
    card.appendChild(btn);
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  container.appendChild(wrap);

  function rerender() { container.innerHTML = ''; renderStore(container, game); }
}
