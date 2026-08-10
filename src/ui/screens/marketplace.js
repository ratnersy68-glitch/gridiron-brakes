import { cardTileEl } from '../cardView.js';
import { quoteOffer, offerMatches } from '../../systems/marketplace.js';
import { money } from '../../utils/format.js';

export function renderMarketplace(container, game) {
  const s = game.state;
  const wrap = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'panel';
  header.innerHTML = `<div class="panel-title">Marketplace <span class="sub">AI collectors, live auctions, fluctuating prices</span></div>
    <div class="muted">Offers refresh each in-game day. Advance the day from the top bar to see new requests and resolve auctions.</div>`;
  wrap.appendChild(header);

  const offersPanel = document.createElement('div');
  offersPanel.className = 'panel';
  offersPanel.innerHTML = `<div class="panel-title">Collector Requests</div>`;
  const offers = s.marketplace.dailyOffers || [];
  if (!offers.length) {
    offersPanel.innerHTML += `<div class="empty-state">No active requests. Advance the day to refresh.</div>`;
  } else {
    const list = document.createElement('div');
    list.className = 'grid grid-cols-3';
    offers.forEach(offer => {
      const matching = s.ownedCards.filter(c => offerMatches(offer, c) && !c.locked);
      const row = document.createElement('div');
      row.className = 'stat-block';
      row.innerHTML = `<div class="label">${offer.buyer}</div>
        <div class="value" style="font-size:15px;">${offer.ask.label}</div>
        <div class="muted" style="font-size:12px;">Pays ~${Math.round(offer.premium * 100)}% of market value</div>`;
      const select = document.createElement('select');
      select.className = 'btn btn-sm mt-8';
      if (!matching.length) {
        select.innerHTML = '<option>No matching cards</option>';
        select.disabled = true;
      } else {
        matching.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.uid;
          opt.textContent = `${c.playerName} — ${c.typeLabel} (${money(quoteOffer(offer, c, s.market))})`;
          select.appendChild(opt);
        });
      }
      row.appendChild(select);
      const sellBtn = document.createElement('button');
      sellBtn.className = 'btn btn-success btn-sm mt-8 btn-block';
      sellBtn.textContent = 'Sell to Collector';
      sellBtn.disabled = !matching.length;
      sellBtn.addEventListener('click', () => game.fulfillOffer(offer.id, select.value));
      row.appendChild(sellBtn);
      list.appendChild(row);
    });
    offersPanel.appendChild(list);
  }
  wrap.appendChild(offersPanel);

  const auctionsPanel = document.createElement('div');
  auctionsPanel.className = 'panel';
  auctionsPanel.innerHTML = `<div class="panel-title">Your Auctions</div>`;
  const auctions = s.marketplace.auctions || [];
  if (!auctions.length) {
    auctionsPanel.innerHTML += `<div class="empty-state">No active auctions. Start one from a card in your Binder.</div>`;
  } else {
    const grid = document.createElement('div');
    grid.className = 'card-grid';
    auctions.forEach(a => {
      const tile = cardTileEl(a.card, { showValue: true, valueOverride: a.finalPrice ?? a.startingValue });
      const badge = document.createElement('div');
      badge.className = 'tag';
      badge.style.position = 'absolute';
      badge.style.bottom = '30px';
      badge.style.left = '8px';
      badge.textContent = a.resolved ? `Sold: ${money(a.finalPrice)}` : `Ends day ${a.endsOnDay}`;
      tile.appendChild(badge);
      grid.appendChild(tile);
    });
    auctionsPanel.appendChild(grid);
  }
  wrap.appendChild(auctionsPanel);

  container.appendChild(wrap);
}
