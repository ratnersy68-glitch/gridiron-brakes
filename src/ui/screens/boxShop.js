import { BOXES } from '../../data/boxes.js';
import { money } from '../../utils/format.js';
import { boxArtEl } from '../boxArt.js';

export function renderBoxShop(container, game) {
  const s = game.state;
  const wrap = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'panel';
  header.innerHTML = `<div class="panel-title">Box Shop <span class="sub">17 products, from starter packs to the whale-tier chest</span></div>
    <div class="muted">Higher-tier boxes cost more but skew odds hard toward numbered parallels, autographs, inserts, and one-of-ones.</div>`;
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
    details.innerHTML = `
      <div class="brand-tag">${box.brand}</div>
      <div class="box-name">${box.name}</div>
      <div class="box-blurb">${box.blurb}</div>
      <div class="box-meta">Guarantees: ${guarantees}</div>
      <div class="price">${money(box.price)}</div>
    `;
    card.appendChild(details);
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-block';
    btn.textContent = 'Buy & Open';
    btn.disabled = s.cash < box.price;
    btn.addEventListener('click', () => {
      const res = game.buyBox(box.key);
      if (res.ok) game.setScreen('opening', { box: res.box, packs: res.packs });
    });
    card.appendChild(btn);
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  container.appendChild(wrap);
}
