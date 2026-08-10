import { currentStageInfo, conditionOf, STANCES } from '../../systems/shopJob.js';
import { money, moneyExact } from '../../utils/format.js';
import { renderNpcSVG } from '../npcArt.js';
import { cardTileEl } from '../cardView.js';
import { BOXES } from '../../data/boxes.js';
import { renderBoxArtSVG } from '../boxArt.js';
import { sfx } from '../../systems/sound.js';

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
  wrap.appendChild(shiftPanel);

  if (!s.shop.currentShift) {
    shiftPanel.innerHTML = `<div class="panel-title">Work a Shift</div>
      <div class="muted">Customers walk up to the counter with cards to sell. Judge the lot, mind the condition, make an offer.</div>`;
    const startBtn = document.createElement('button');
    startBtn.className = 'btn btn-primary mt-16';
    startBtn.textContent = 'Clock In (4 customers)';
    startBtn.addEventListener('click', () => { game.generateShift(); rerender(); });
    shiftPanel.appendChild(startBtn);
    container.appendChild(wrap);
    return;
  }

  // --- The store scene -----------------------------------------------------
  const shift = s.shop.currentShift;
  const current = shift.customers.find(c => !c.resolved);
  const resolvedCount = shift.customers.filter(c => c.resolved).length;

  shiftPanel.innerHTML = `<div class="panel-title">On the Clock <span class="sub">Customer ${Math.min(resolvedCount + 1, shift.customers.length)} of ${shift.customers.length} • Shift profit so far: ${money(shift.profit)}</span></div>`;

  const scene = document.createElement('div');
  scene.className = 'shop-scene';
  shiftPanel.appendChild(scene);

  // backdrop shelf with product boxes
  const shelf = document.createElement('div');
  shelf.className = 'shop-shelf';
  [0, 1, 2, 3].forEach(i => {
    const holder = document.createElement('div');
    holder.className = 'shelf-box';
    holder.innerHTML = renderBoxArtSVG(BOXES[(i * 4 + 1) % BOXES.length], { width: 84, height: 63 });
    shelf.appendChild(holder);
  });
  scene.appendChild(shelf);

  const counter = document.createElement('div');
  counter.className = 'shop-counter';
  scene.appendChild(counter);

  if (!current) {
    // shift done — summary
    const summary = document.createElement('div');
    summary.className = 'shift-summary slide-up';
    const deals = shift.customers.filter(c => c.accepted).length;
    summary.innerHTML = `<div class="panel-title">Shift Complete</div>
      <div class="muted">${deals} of ${shift.customers.length} deals closed • Shop profit ${money(Math.max(0, shift.profit))}</div>
      <div class="muted">Wage ${moneyExact(stageInfo.wage || 0)} + ${Math.round((stageInfo.commission || 0) * 100)}% commission</div>`;
    const endBtn = document.createElement('button');
    endBtn.className = 'btn btn-gold mt-16';
    endBtn.textContent = 'Clock Out & Collect Pay';
    endBtn.addEventListener('click', () => { sfx.cashRegister(); game.endShift(); rerender(); });
    summary.appendChild(endBtn);
    scene.appendChild(summary);
    container.appendChild(wrap);
    return;
  }

  // NPC at the counter
  const npcSide = document.createElement('div');
  npcSide.className = 'npc-side npc-walk-in';
  npcSide.innerHTML = renderNpcSVG(current.appearanceSeed, { width: 140, height: 182 });
  scene.appendChild(npcSide);

  const bubble = document.createElement('div');
  bubble.className = 'speech-bubble slide-up';
  bubble.innerHTML = `<strong>${current.name}</strong><br />
    “Got ${current.cards.length === 1 ? 'this card' : `these ${current.cards.length} cards`} — I'm asking <strong>${moneyExact(current.askPrice)}</strong>.”`;
  scene.appendChild(bubble);

  // the lot on the counter, face-up with condition labels
  const lot = document.createElement('div');
  lot.className = 'counter-lot';
  current.cards.forEach((card, i) => {
    const holder = document.createElement('div');
    holder.className = 'lot-card slide-up';
    holder.style.animationDelay = `${i * 0.08}s`;
    holder.appendChild(cardTileEl(card, { valueOverride: game.cardValue(card) }));
    const cond = conditionOf(card.condition);
    const badge = document.createElement('div');
    badge.className = 'condition-badge';
    badge.style.background = cond.color;
    badge.textContent = cond.label;
    holder.appendChild(badge);
    lot.appendChild(holder);
  });
  scene.appendChild(lot);

  const lotInfo = document.createElement('div');
  lotInfo.className = 'muted lot-info';
  lotInfo.textContent = `Condition-adjusted lot value: ~${moneyExact(current.lotValue)} • They're asking ${moneyExact(current.askPrice)}`;
  scene.appendChild(lotInfo);

  const btnRow = document.createElement('div');
  btnRow.className = 'flex flex-wrap gap-8 negotiation-row';
  [['lowball', 'Lowball'], ['fair', 'Fair Offer'], ['generous', 'Generous']].forEach(([key, label]) => {
    const b = document.createElement('button');
    b.className = 'btn' + (key === 'fair' ? ' btn-primary' : key === 'generous' ? ' btn-success' : '');
    const offerAmt = current.askPrice * STANCES[key].offerFrac;
    b.innerHTML = `${label}<br /><span style="font-size:11px;opacity:0.85">${moneyExact(offerAmt)}</span>`;
    b.addEventListener('click', () => {
      const res = game.negotiate(current.id, key);
      if (res.ok) {
        if (res.accepted) sfx.cashRegister(); else sfx.error();
        showOutcome(res, current);
      }
    });
    btnRow.appendChild(b);
  });
  scene.appendChild(btnRow);

  container.appendChild(wrap);

  function showOutcome(res, customer) {
    btnRow.remove();
    lotInfo.remove();
    bubble.innerHTML = res.accepted
      ? `<strong>${customer.name}</strong><br />“Deal! ${moneyExact(res.offer)} it is.” <span class="muted">(shop profit ${money(res.profit)})</span>`
      : `<strong>${customer.name}</strong><br />“Nah, that's too low for me. I'll try somewhere else.”`;
    npcSide.classList.remove('npc-walk-in');
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary mt-16';
    const remaining = shift.customers.filter(c => !c.resolved).length;
    nextBtn.textContent = remaining ? 'Next Customer' : 'Finish Up';
    nextBtn.addEventListener('click', () => {
      npcSide.classList.add('npc-walk-out');
      setTimeout(() => rerender(), 300);
    });
    scene.appendChild(nextBtn);
  }

  function rerender() {
    container.innerHTML = '';
    renderShopJob(container, game);
  }
}
