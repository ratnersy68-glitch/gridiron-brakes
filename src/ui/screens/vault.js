import { GRAILS } from '../../data/grails.js';
import { grailCardEl } from '../grailCard.js';
import { money, moneyExact } from '../../utils/format.js';
import { DAILY_PAYOUT_RATE } from '../../systems/state.js';

export function renderVault(container, game) {
  const s = game.state;
  const wrap = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'panel';
  header.innerHTML = `<div class="panel-title">The Vault <span class="sub">${s.grailsOwned?.length || 0} of ${GRAILS.length} grails secured</span></div>
    <div class="muted">Six one-of-one cards that never touched a pack, priced from a trillion to a quintillion dollars. Each can only be bought once — and each one it lands in your collection compounds your daily payout, because the payout scales with your net worth.</div>
    <div class="muted mt-8">Net worth <strong style="color:var(--accent)">${money(s.stats.netWorth)}</strong> &bull; next payout <strong style="color:var(--accent)">${money(game.nextDailyPayout())}</strong> (${Math.round(DAILY_PAYOUT_RATE * 100)}% of net worth, floor ${money(1e6)})</div>`;
  wrap.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'vault-grid mt-16';

  GRAILS.forEach(grail => {
    const owned = (s.grailsOwned || []).includes(grail.key);
    const entry = document.createElement('div');
    entry.className = 'vault-entry';

    entry.appendChild(grailCardEl(grail, { owned }));

    const copy = document.createElement('div');
    copy.className = 'vault-copy';
    copy.textContent = grail.blurb;
    entry.appendChild(copy);

    const tagline = document.createElement('div');
    tagline.className = 'vault-tagline';
    tagline.textContent = `“${grail.tagline}”`;
    entry.appendChild(tagline);

    if (owned) {
      const tag = document.createElement('div');
      tag.className = 'vault-owned-tag';
      tag.textContent = '✦ SECURED';
      entry.appendChild(tag);
    } else {
      const btn = document.createElement('button');
      btn.className = 'btn btn-gold btn-block';
      btn.textContent = `Acquire — ${money(grail.price)}`;
      btn.disabled = s.cash < grail.price;
      btn.addEventListener('click', () => {
        if (confirm(`Acquire the ${grail.name} for ${money(grail.price)}?`)) {
          game.buyGrail(grail.key);
        }
      });
      entry.appendChild(btn);

      if (s.cash < grail.price) {
        const note = document.createElement('div');
        note.className = 'vault-locked-note';
        const short = grail.price - s.cash;
        note.textContent = `Need ${money(short)} more.`;
        entry.appendChild(note);
      }
    }

    grid.appendChild(entry);
  });

  wrap.appendChild(grid);
  container.appendChild(wrap);
}
