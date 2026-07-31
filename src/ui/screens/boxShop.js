import { BOXES } from '../../data/boxes.js';
import { money } from '../../utils/format.js';
import { boxArtEl } from '../boxArt.js';

const QUANTITIES = [1, 5, 10, 25, 50];
let activeQty = 1;

export function renderBoxShop(container, game) {
  const s = game.state;
  const wrap = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'panel';
  header.innerHTML = `<div class="panel-title">Box Shop <span class="sub">17 products, from starter packs to the whale-tier chest</span></div>
    <div class="muted">Higher-tier boxes cost more but skew odds hard toward numbered parallels, autographs, inserts, and one-of-ones.</div>`;

  const qtyLabel = document.createElement('div');
  qtyLabel.className = 'muted mt-16';
  qtyLabel.style.fontSize = '12px';
  qtyLabel.textContent = 'How many of each box to buy:';
  header.appendChild(qtyLabel);

  const qtyRow = document.createElement('div');
  qtyRow.className = 'filter-row mt-8';
  QUANTITIES.forEach(q => {
    const chip = document.createElement('button');
    chip.className = 'filter-chip' + (activeQty === q ? ' active' : '');
    chip.textContent = `×${q}`;
    chip.addEventListener('click', () => { activeQty = q; rerender(); });
    qtyRow.appendChild(chip);
  });
  header.appendChild(qtyRow);
  wrap.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-4 mt-16';

  const sorted = [...BOXES].sort((a, b) => a.price - b.price);
  sorted.forEach(box => {
    const card = document.createElement('div');
    card.className = 'box-card';
    const guarantees = (box.guarantees || []).map(g => `${g.count}× ${g.type}`).join(', ') || 'No guarantees';
    card.appendChild(boxArtEl(box));
    const details = document.createElement('div');
    const totalCost = box.price * activeQty;
    details.innerHTML = `
      <div class="brand-tag">${box.brand}</div>
      <div class="box-name">${box.name}</div>
      <div class="box-blurb">${box.blurb}</div>
      <div class="box-meta">Guarantees: ${guarantees}</div>
      <div class="price">${money(totalCost)}${activeQty > 1 ? `<span class="muted" style="font-size:12px;font-weight:600"> for ${activeQty}</span>` : ''}</div>
    `;
    card.appendChild(details);

    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-block';
    btn.textContent = activeQty > 1 ? `Buy ${activeQty} & Rip Case` : 'Buy & Open';
    btn.disabled = s.cash < totalCost;
    btn.addEventListener('click', () => {
      const res = game.buyBoxes(box.key, activeQty);
      if (res.ok) game.setScreen('opening', { box: res.box, packs: res.packs, qty: res.qty, totalCost: res.totalCost });
    });
    card.appendChild(btn);
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  container.appendChild(wrap);

  function rerender() {
    container.innerHTML = '';
    renderBoxShop(container, game);
  }
}
