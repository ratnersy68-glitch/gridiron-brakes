import { CAREER_STAGES, currentStageInfo } from '../../systems/shopJob.js';
import { money } from '../../utils/format.js';

export function renderShopJob(container, game) {
  const s = game.state;
  const wrap = document.createElement('div');
  const stageInfo = currentStageInfo(s.shop.careerStage);

  const header = document.createElement('div');
  header.className = 'panel';
  header.innerHTML = `<div class="panel-title">Card Shop Career <span class="sub">${stageInfo.title}</span></div>
    <div class="muted">Shifts worked: ${s.shop.shiftsWorked} • Lifetime wages: ${money(s.shop.totalWagesEarned)}</div>`;
  wrap.appendChild(header);

  if (s.shop.careerStage === 0) {
    const applyPanel = document.createElement('div');
    applyPanel.className = 'panel';
    applyPanel.innerHTML = `<div class="panel-title">Looking for work?</div>
      <div class="muted">The local card shop is hiring. Start as an employee, work your way up to owning the biggest shop in the game.</div>`;
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary mt-16';
    btn.textContent = 'Apply for the Job';
    btn.addEventListener('click', () => { game.applyForJob(); rerender(); });
    applyPanel.appendChild(btn);
    wrap.appendChild(applyPanel);
    container.appendChild(wrap);
    return;
  }

  const promo = game.eligibleForPromotion();
  if (promo) {
    const promoPanel = document.createElement('div');
    promoPanel.className = 'panel';
    promoPanel.style.borderColor = 'var(--gold)';
    const req = stageInfo.promoteAt || {};
    const reqText = req.buyoutCash ? `Costs ${money(req.buyoutCash)} to buy out.` : 'Ready to promote — no cost.';
    promoPanel.innerHTML = `<div class="panel-title">Promotion Available: ${promo.title}</div><div class="muted">${reqText}</div>`;
    const btn = document.createElement('button');
    btn.className = 'btn btn-gold mt-16';
    btn.textContent = `Become ${promo.title}`;
    btn.disabled = req.buyoutCash ? s.cash < req.buyoutCash : false;
    btn.addEventListener('click', () => { game.promote(); rerender(); });
    promoPanel.appendChild(btn);
    wrap.appendChild(promoPanel);
  }

  const shiftPanel = document.createElement('div');
  shiftPanel.className = 'panel';
  shiftPanel.innerHTML = `<div class="panel-title">Work a Shift</div>`;
  wrap.appendChild(shiftPanel);

  if (!s.shop.currentShift) {
    const startBtn = document.createElement('button');
    startBtn.className = 'btn btn-primary';
    startBtn.textContent = 'Start Shift (4 customers)';
    startBtn.addEventListener('click', () => { game.generateShift(); rerender(); });
    shiftPanel.appendChild(startBtn);
  } else {
    const shift = s.shop.currentShift;
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 mt-16';
    shift.customers.forEach(c => {
      const row = document.createElement('div');
      row.className = 'stat-block';
      if (!c.resolved) {
        row.innerHTML = `<div class="label">${c.name}</div>
          <div class="value" style="font-size:15px;">Wants ${money(c.askPrice)} for a collection lot (est. worth ${money(c.lotValue)})</div>`;
        const btnRow = document.createElement('div');
        btnRow.className = 'flex gap-8 mt-8';
        [['lowball', 'Lowball'], ['fair', 'Fair Offer'], ['generous', 'Generous']].forEach(([key, label]) => {
          const b = document.createElement('button');
          b.className = 'btn btn-sm';
          b.textContent = label;
          b.addEventListener('click', () => { game.negotiate(c.id, key); rerender(); });
          btnRow.appendChild(b);
        });
        row.appendChild(btnRow);
      } else {
        row.innerHTML = `<div class="label">${c.name}</div>
          <div class="value" style="font-size:14px;">${c.accepted ? `Deal at ${money(c.offer)} — profit ${money(c.profit)}` : 'Walked away, no deal'}</div>`;
      }
      grid.appendChild(row);
    });
    shiftPanel.appendChild(grid);

    const allResolved = shift.customers.every(c => c.resolved);
    if (allResolved) {
      const endBtn = document.createElement('button');
      endBtn.className = 'btn btn-gold mt-16';
      endBtn.textContent = 'End Shift & Collect Pay';
      endBtn.addEventListener('click', () => { game.endShift(); rerender(); });
      shiftPanel.appendChild(endBtn);
    }
  }

  container.appendChild(wrap);

  function rerender() {
    container.innerHTML = '';
    renderShopJob(container, game);
  }
}
