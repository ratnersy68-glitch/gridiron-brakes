import { TEAMS } from '../../data/teams.js';
import { PLAYERS } from '../../data/players.js';
import { cardTileEl, silhouetteTileEl } from '../cardView.js';
import { openCardModal } from '../cardModal.js';
import { missingChecklistForTeam } from '../../systems/binder.js';
import { pct, money } from '../../utils/format.js';
import { sfx } from '../../systems/sound.js';

const GROUPINGS = [
  { key: 'all', label: 'All Cards' },
  { key: 'team', label: 'Team' },
  { key: 'player', label: 'Player' },
  { key: 'year', label: 'Year' },
  { key: 'parallel', label: 'Parallel' },
  { key: 'numbered', label: 'Numbered' },
  { key: 'insert', label: 'Insert' },
  { key: 'auto', label: 'Autograph' },
  { key: 'rarity', label: 'Rarity' },
];

const POCKETS_PER_PAGE = 9; // classic 9-pocket sleeve page

let activeGroup = 'all';
let activeTeamId = null;
let activeSubgroup = null;
let pageIndex = 0;
let coverOpened = false; // remembered for the session so the cover ritual doesn't repeat

export function renderBinder(container, game) {
  const s = game.state;
  const wrap = document.createElement('div');

  // --- Header: stats + bulk actions --------------------------------------
  const header = document.createElement('div');
  header.className = 'panel';
  header.innerHTML = `<div class="panel-title">The Binder <span class="sub">${s.ownedCards.length.toLocaleString()} cards owned • ${s.everCollectedKeys.length.toLocaleString()} unique ever collected</span></div>`;
  const progress = document.createElement('div');
  progress.className = 'progress-bar';
  progress.innerHTML = `<div class="fill" style="width:${Math.min(100, s.stats.binderCompletionPct)}%"></div>`;
  header.appendChild(progress);
  const progressLabel = document.createElement('div');
  progressLabel.className = 'muted mt-8';
  progressLabel.style.fontSize = '12px';
  progressLabel.textContent = `${pct(s.stats.binderCompletionPct / 100, 3)} overall binder completion • ${s.stats.setsCompleted} sets completed`;
  header.appendChild(progressLabel);

  const actionRow = document.createElement('div');
  actionRow.className = 'flex flex-wrap gap-8 mt-8';
  const dupBtn = document.createElement('button');
  dupBtn.className = 'btn btn-sm';
  dupBtn.textContent = 'Sell All Duplicates';
  dupBtn.title = 'Instantly sells every duplicate copy (keeps one of each; skips locked and favorited cards)';
  dupBtn.addEventListener('click', () => game.sellAllDuplicates());
  actionRow.appendChild(dupBtn);

  const sellAllBtn = document.createElement('button');
  sellAllBtn.className = 'btn btn-danger btn-sm';
  sellAllBtn.textContent = 'Sell Entire Collection';
  sellAllBtn.title = 'Sells every card at buylist price. Locked and favorited cards are kept.';
  sellAllBtn.addEventListener('click', () => {
    const sellable = s.ownedCards.filter(c => !c.locked && !c.favorite);
    if (!sellable.length) { game.sellEntireCollection(); return; }
    const est = sellable.reduce((sum, c) => sum + game.cardValue(c) * 0.8, 0);
    if (confirm(`Sell ${sellable.length} cards for roughly ${money(est)}? Locked and favorited cards are kept. This cannot be undone.`)) {
      game.sellEntireCollection();
    }
  });
  actionRow.appendChild(sellAllBtn);
  header.appendChild(actionRow);
  wrap.appendChild(header);

  // --- Filters -------------------------------------------------------------
  const filterPanel = document.createElement('div');
  filterPanel.className = 'panel';
  const filterRow = document.createElement('div');
  filterRow.className = 'filter-row';
  GROUPINGS.forEach(g => {
    const chip = document.createElement('button');
    chip.className = 'filter-chip' + (activeGroup === g.key ? ' active' : '');
    chip.textContent = g.label;
    chip.addEventListener('click', () => {
      activeGroup = g.key; activeSubgroup = null; pageIndex = 0;
      rerender();
    });
    filterRow.appendChild(chip);
  });
  filterPanel.appendChild(filterRow);

  const controlsRow = document.createElement('div');
  controlsRow.className = 'flex flex-wrap gap-8';
  filterPanel.appendChild(controlsRow);

  const body = document.createElement('div');
  filterPanel.appendChild(body);
  wrap.appendChild(filterPanel);
  container.appendChild(wrap);

  function rerender() {
    container.innerHTML = '';
    renderBinder(container, game);
  }

  // --- Build the pocket inventory for the active view ---------------------
  function pocketsForView() {
    if (activeGroup === 'team') {
      const teamSelect = document.createElement('select');
      teamSelect.className = 'btn btn-sm';
      const placeholder = document.createElement('option');
      placeholder.textContent = 'Choose a team...';
      placeholder.value = '';
      teamSelect.appendChild(placeholder);
      TEAMS.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        const p = s.stats.teamSetProgress[t.id] || 0;
        opt.textContent = `${t.name} (${Math.round(p * 100)}%)`;
        teamSelect.appendChild(opt);
      });
      if (activeTeamId) teamSelect.value = activeTeamId;
      teamSelect.addEventListener('change', () => { activeTeamId = teamSelect.value || null; pageIndex = 0; rerender(); });
      controlsRow.appendChild(teamSelect);

      if (!activeTeamId) return { pockets: [], hint: 'Pick a team to lay its checklist out in the binder.' };
      const checklist = missingChecklistForTeam(s, activeTeamId);
      const pockets = checklist.map(({ player, owned }) => {
        if (!owned) return { kind: 'silhouette', player };
        const stillOwned = s.ownedCards.find(c => c.playerId === player.id);
        if (stillOwned) return { kind: 'card', card: stillOwned };
        return { kind: 'ledger', player };
      });
      return { pockets };
    }

    // grouped / all views operate on owned cards
    let cards = [...s.ownedCards];
    if (activeGroup !== 'all') {
      const keyOf = (card) => {
        switch (activeGroup) {
          case 'player': return card.playerName;
          case 'year': return String(card.rookieYear);
          case 'parallel': return card.category === 'finish' ? card.typeLabel : null;
          case 'numbered': return card.category === 'numbered' ? card.typeLabel : null;
          case 'insert': return card.category === 'insert' ? card.typeLabel : null;
          case 'auto': return card.category === 'signature' ? card.typeLabel : null;
          case 'rarity': return card.rarityLabel;
          default: return 'All';
        }
      };
      const groups = new Map();
      for (const c of cards) {
        const k = keyOf(c);
        if (!k) continue;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(c);
      }
      const keys = [...groups.keys()].sort();
      if (!keys.length) return { pockets: [], hint: 'No cards in this view yet — open some boxes!' };
      if (!activeSubgroup || !groups.has(activeSubgroup)) activeSubgroup = keys[0];

      const subSelect = document.createElement('select');
      subSelect.className = 'btn btn-sm';
      keys.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = `${k} (${groups.get(k).length})`;
        subSelect.appendChild(opt);
      });
      subSelect.value = activeSubgroup;
      subSelect.addEventListener('change', () => { activeSubgroup = subSelect.value; pageIndex = 0; rerender(); });
      controlsRow.appendChild(subSelect);
      cards = groups.get(activeSubgroup);
    }
    cards.sort((a, b) => game.cardValue(b) - game.cardValue(a));
    return { pockets: cards.map(card => ({ kind: 'card', card })) };
  }

  const { pockets, hint } = pocketsForView();

  // --- The binder book -----------------------------------------------------
  const book = document.createElement('div');
  book.className = 'binder-book';
  body.appendChild(book);

  if (hint) {
    book.innerHTML = `<div class="empty-state">${hint}</div>`;
    return;
  }
  if (!pockets.length) {
    book.innerHTML = '<div class="empty-state">This binder page is empty — open some boxes!</div>';
    return;
  }

  if (!coverOpened) {
    const cover = document.createElement('div');
    cover.className = 'binder-cover';
    cover.innerHTML = `
      <div class="binder-cover-inner">
        <div class="binder-cover-title">🏈 ${s.name}'s Binder</div>
        <div class="binder-cover-sub">${s.ownedCards.length.toLocaleString()} cards • tap to open</div>
      </div>`;
    cover.addEventListener('click', () => {
      sfx.cardSlide();
      cover.classList.add('opening');
      setTimeout(() => { coverOpened = true; rerender(); }, 650);
    }, { once: true });
    book.appendChild(cover);
    return;
  }

  const totalPages = Math.max(1, Math.ceil(pockets.length / POCKETS_PER_PAGE));
  pageIndex = Math.min(pageIndex, totalPages - 1);

  const pageNav = document.createElement('div');
  pageNav.className = 'binder-page-nav';
  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn btn-sm btn-ghost';
  prevBtn.textContent = '◀ Prev Page';
  prevBtn.disabled = pageIndex === 0;
  const pageLabel = document.createElement('span');
  pageLabel.className = 'muted';
  pageLabel.textContent = `Page ${pageIndex + 1} of ${totalPages}`;
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn-sm btn-ghost';
  nextBtn.textContent = 'Next Page ▶';
  nextBtn.disabled = pageIndex >= totalPages - 1;
  pageNav.appendChild(prevBtn);
  pageNav.appendChild(pageLabel);
  pageNav.appendChild(nextBtn);
  book.appendChild(pageNav);

  const page = document.createElement('div');
  page.className = 'binder-page slide-up';
  book.appendChild(page);

  const rings = document.createElement('div');
  rings.className = 'binder-rings';
  rings.innerHTML = '<span></span><span></span><span></span>';
  page.appendChild(rings);

  const grid = document.createElement('div');
  grid.className = 'pocket-grid';
  page.appendChild(grid);

  const pagePockets = pockets.slice(pageIndex * POCKETS_PER_PAGE, (pageIndex + 1) * POCKETS_PER_PAGE);
  for (let i = 0; i < POCKETS_PER_PAGE; i++) {
    const slot = pagePockets[i];
    const pocket = document.createElement('div');
    pocket.className = 'pocket';
    if (!slot) {
      pocket.classList.add('empty');
      grid.appendChild(pocket);
      continue;
    }
    if (slot.kind === 'silhouette') {
      pocket.appendChild(silhouetteTileEl(slot.player));
    } else if (slot.kind === 'ledger') {
      const placeholder = { playerId: slot.player.id, playerName: slot.player.name, teamId: slot.player.teamId,
        position: slot.player.position, typeLabel: 'Collected (sold)', rarityLabel: 'In Binder', rarityColor: '#9aa0a6',
        rarityKey: 'common', baseValue: 0, marketValue: 0, uid: `ledger_${slot.player.id}` };
      pocket.appendChild(cardTileEl(placeholder, { showValue: false }));
    } else {
      const tile = cardTileEl(slot.card, { valueOverride: game.cardValue(slot.card) });
      pocket.appendChild(tile);
      // Click: the card slides up out of the plastic sleeve, then opens.
      pocket.addEventListener('click', () => {
        if (pocket.classList.contains('sliding')) return;
        pocket.classList.add('sliding');
        sfx.cardSlide();
        setTimeout(() => {
          openCardModal(game, slot.card, { context: 'binder' });
          setTimeout(() => pocket.classList.remove('sliding'), 300);
        }, 340);
      });
    }
    const sleeve = document.createElement('div');
    sleeve.className = 'sleeve';
    pocket.appendChild(sleeve);
    grid.appendChild(pocket);
  }

  const flip = (dir) => {
    sfx.cardFlip();
    page.classList.add(dir === 1 ? 'flip-out-left' : 'flip-out-right');
    setTimeout(() => { pageIndex += dir; rerender(); }, 240);
  };
  prevBtn.addEventListener('click', () => flip(-1));
  nextBtn.addEventListener('click', () => flip(1));
}
