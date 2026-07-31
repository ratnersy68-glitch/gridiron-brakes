import { money, moneyExact } from '../utils/format.js';
import { sfx } from '../systems/sound.js';

function sparklineSvg(points, width = 440, height = 90) {
  if (!points.length) return '';
  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / Math.max(1, points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p.value - min) / range) * (height - 10) - 5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = values[values.length - 1];
  const first = values[0];
  const color = last >= first ? 'var(--success)' : 'var(--danger)';
  return `<svg width="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
    <polyline points="${coords}" fill="none" stroke="${color}" stroke-width="2.5" />
  </svg>`;
}

export function openCardModal(game, card, { context = 'binder' } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay fade-in';
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const modal = document.createElement('div');
  modal.className = 'modal slide-up';
  overlay.appendChild(modal);

  function close() { overlay.remove(); }

  function renderBody() {
    const history = game.priceHistory(card.playerId);
    const value = game.cardValue(card);
    modal.innerHTML = `
      <h3>${card.playerName} <span class="tag" style="color:${card.rarityColor}">${card.rarityLabel}</span></h3>
      <div class="muted">${card.teamName} • ${card.position} • ${card.typeLabel}${card.serial ? ` #${card.serial}/${card.printRun}` : ''}${card.isRookie ? ' • Rookie Card' : ''}</div>
      <div class="mt-16" style="font-size:26px;font-weight:800;color:var(--accent)">${moneyExact(value)}</div>
      <div class="muted" style="font-size:12px">Base value ${moneyExact(card.baseValue)} • Market index applied live</div>
      <div class="panel mt-16" style="padding:12px;">
        <div class="panel-title" style="margin-bottom:6px;font-size:13px;">Price History</div>
        ${sparklineSvg(history)}
      </div>
      <div class="flex flex-wrap gap-8 mt-16" id="modal-actions"></div>
      <button class="btn btn-ghost btn-block mt-16" id="modal-close">Close</button>
    `;

    const actions = modal.querySelector('#modal-actions');

    if (context === 'binder') {
      const sellBtn = document.createElement('button');
      sellBtn.className = 'btn btn-success';
      sellBtn.textContent = `Sell Instantly (${moneyExact(Math.round(value * 0.88))})`;
      sellBtn.disabled = card.locked;
      sellBtn.addEventListener('click', () => { sfx.cashRegister(); game.sellInstant(card.uid); close(); });
      actions.appendChild(sellBtn);

      const auctionBtn = document.createElement('button');
      auctionBtn.className = 'btn btn-primary';
      auctionBtn.textContent = 'Start Auction';
      auctionBtn.disabled = card.locked;
      auctionBtn.addEventListener('click', () => { game.startAuction(card.uid); close(); });
      actions.appendChild(auctionBtn);

      const tradeBtn = document.createElement('button');
      tradeBtn.className = 'btn';
      tradeBtn.textContent = `Trade (${moneyExact(Math.round(value * 1.15))})`;
      tradeBtn.disabled = card.locked;
      tradeBtn.addEventListener('click', () => { game.tradeCard(card.uid); close(); });
      actions.appendChild(tradeBtn);
    }

    const favBtn = document.createElement('button');
    favBtn.className = 'btn btn-ghost';
    favBtn.textContent = card.favorite ? '★ Unfavorite' : '☆ Favorite';
    favBtn.addEventListener('click', () => { game.toggleFavorite(card.uid); card.favorite = !card.favorite; renderBody(); });
    actions.appendChild(favBtn);

    const lockBtn = document.createElement('button');
    lockBtn.className = 'btn btn-ghost';
    lockBtn.textContent = card.locked ? '🔒 Unlock' : '🔓 Lock';
    lockBtn.addEventListener('click', () => { game.toggleLock(card.uid); card.locked = !card.locked; renderBody(); });
    actions.appendChild(lockBtn);

    modal.querySelector('#modal-close').addEventListener('click', close);
  }

  renderBody();
  document.body.appendChild(overlay);
  return close;
}
