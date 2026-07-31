import { money, moneyExact, pct } from '../../utils/format.js';
import { BOXES } from '../../data/boxes.js';
import { CAREER_STAGES, currentStageInfo } from '../../systems/shopJob.js';

function statBlock(label, value) {
  const el = document.createElement('div');
  el.className = 'stat-block';
  el.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`;
  return el;
}

export function renderHome(container, game) {
  const s = game.state;
  const stats = s.stats;

  const wrap = document.createElement('div');

  if (s.market.event) {
    const banner = document.createElement('div');
    banner.className = 'panel';
    banner.style.borderColor = 'var(--gold)';
    banner.innerHTML = `<div class="panel-title">🎉 ${s.market.event.name}</div><div class="muted">Market values are running hot for the next ${s.market.event.daysLeft} day(s). Good time to sell.</div>`;
    wrap.appendChild(banner);
  }

  const overview = document.createElement('div');
  overview.className = 'panel';
  overview.innerHTML = `<div class="panel-title">Collector Overview <span class="sub">Day ${s.day}</span></div>`;
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-4';
  grid.appendChild(statBlock('Net Worth', money(stats.netWorth)));
  grid.appendChild(statBlock('Cash on Hand', moneyExact(s.cash)));
  grid.appendChild(statBlock('Cards Owned', s.ownedCards.length.toLocaleString()));
  grid.appendChild(statBlock('Binder Completion', pct(stats.binderCompletionPct / 100, 2)));
  grid.appendChild(statBlock('Packs Opened', stats.totalPacksOpened.toLocaleString()));
  grid.appendChild(statBlock('Boxes Opened', stats.totalBoxesOpened.toLocaleString()));
  grid.appendChild(statBlock('Biggest Sale', money(stats.biggestSale)));
  grid.appendChild(statBlock('Sets Completed', stats.setsCompleted.toLocaleString()));
  overview.appendChild(grid);
  wrap.appendChild(overview);

  const career = document.createElement('div');
  career.className = 'panel';
  const stageInfo = currentStageInfo(stats.careerStage);
  career.innerHTML = `<div class="panel-title">Career: ${stageInfo.title}</div>
    <div class="muted">Shifts worked: ${s.shop.shiftsWorked} • Lifetime wages: ${money(s.shop.totalWagesEarned)}</div>`;
  wrap.appendChild(career);

  const quickBuy = document.createElement('div');
  quickBuy.className = 'panel';
  quickBuy.innerHTML = `<div class="panel-title">Quick Buy <span class="sub">Popular boxes</span></div>`;
  const qGrid = document.createElement('div');
  qGrid.className = 'grid grid-cols-4';
  const popular = BOXES.filter(b => ['starter', 'blaster', 'hobby', 'national_vault'].includes(b.key));
  popular.forEach(box => {
    const card = document.createElement('div');
    card.className = 'box-card';
    card.innerHTML = `<div class="brand-tag">${box.brand}</div>
      <div class="box-name">${box.name}</div>
      <div class="box-blurb">${box.blurb}</div>
      <div class="price">${money(box.price)}</div>`;
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-block';
    btn.textContent = 'Buy & Open';
    btn.disabled = s.cash < box.price;
    btn.addEventListener('click', () => {
      const res = game.buyBox(box.key);
      if (res.ok) game.setScreen('opening', { box: res.box, packs: res.packs });
    });
    card.appendChild(btn);
    qGrid.appendChild(card);
  });
  quickBuy.appendChild(qGrid);
  wrap.appendChild(quickBuy);

  container.appendChild(wrap);
}
