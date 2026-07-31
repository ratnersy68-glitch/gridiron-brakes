import { TEAMS, getTeam } from '../../data/teams.js';
import { cardTileEl, silhouetteTileEl } from '../cardView.js';
import { openCardModal } from '../cardModal.js';
import { missingChecklistForTeam } from '../../systems/binder.js';
import { pct } from '../../utils/format.js';

const GROUPINGS = [
  { key: 'team', label: 'Team' },
  { key: 'player', label: 'Player' },
  { key: 'year', label: 'Year' },
  { key: 'parallel', label: 'Parallel' },
  { key: 'numbered', label: 'Numbered' },
  { key: 'insert', label: 'Insert' },
  { key: 'auto', label: 'Autograph' },
  { key: 'rarity', label: 'Rarity' },
];

let activeGroup = 'team';
let activeTeamId = null;

export function renderBinder(container, game) {
  const s = game.state;
  const wrap = document.createElement('div');

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
  wrap.appendChild(header);

  const filterPanel = document.createElement('div');
  filterPanel.className = 'panel';
  const filterRow = document.createElement('div');
  filterRow.className = 'filter-row';
  GROUPINGS.forEach(g => {
    const chip = document.createElement('button');
    chip.className = 'filter-chip' + (activeGroup === g.key ? ' active' : '');
    chip.textContent = g.label;
    chip.addEventListener('click', () => { activeGroup = g.key; rerenderInPlace(); });
    filterRow.appendChild(chip);
  });
  filterPanel.appendChild(filterRow);

  const body = document.createElement('div');
  filterPanel.appendChild(body);
  wrap.appendChild(filterPanel);
  container.appendChild(wrap);

  function rerenderInPlace() {
    filterRow.querySelectorAll('.filter-chip').forEach((chip, i) => {
      chip.className = 'filter-chip' + (GROUPINGS[i].key === activeGroup ? ' active' : '');
    });
    renderBody();
  }

  function renderBody() {
    body.innerHTML = '';
    if (activeGroup === 'team') {
      renderTeamView(body, game);
    } else {
      renderGroupedView(body, game, activeGroup);
    }
  }

  renderBody();
}

function renderTeamView(body, game) {
  const teamSelect = document.createElement('select');
  teamSelect.className = 'btn';
  teamSelect.style.marginBottom = '14px';
  const placeholderOpt = document.createElement('option');
  placeholderOpt.textContent = 'Choose a team...';
  placeholderOpt.value = '';
  teamSelect.appendChild(placeholderOpt);
  TEAMS.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    const p = game.state.stats.teamSetProgress[t.id] || 0;
    opt.textContent = `${t.name} (${Math.round(p * 100)}%)`;
    teamSelect.appendChild(opt);
  });
  if (activeTeamId) teamSelect.value = activeTeamId;
  body.appendChild(teamSelect);

  const grid = document.createElement('div');
  grid.className = 'card-grid';
  body.appendChild(grid);

  function draw(teamId) {
    grid.innerHTML = '';
    if (!teamId) {
      grid.innerHTML = '<div class="empty-state">Pick a team to see its roster and your progress.</div>';
      return;
    }
    const checklist = missingChecklistForTeam(game.state, teamId);
    for (const { player, owned } of checklist) {
      if (!owned) { grid.appendChild(silhouetteTileEl(player)); continue; }
      const stillOwned = game.state.ownedCards.find(c => c.playerId === player.id);
      if (stillOwned) {
        grid.appendChild(cardTileEl(stillOwned, {
          onClick: (c) => openCardModal(game, c, { context: 'binder' }),
          valueOverride: game.cardValue(stillOwned),
        }));
      } else {
        const placeholder = { playerId: player.id, playerName: player.name, teamId: player.teamId,
          position: player.position, typeLabel: 'Collected (sold)', rarityLabel: 'In Binder', rarityColor: '#9aa0a6',
          rarityKey: 'common', baseValue: 0, marketValue: 0, uid: `ledger_${player.id}` };
        grid.appendChild(cardTileEl(placeholder, { showValue: false }));
      }
    }
  }

  draw(activeTeamId);
  teamSelect.addEventListener('change', () => { activeTeamId = teamSelect.value; draw(activeTeamId); });
}

function renderGroupedView(body, game, groupKey) {
  const groupsMap = groupOwnedCardsLocal(game.state, groupKey);
  if (!groupsMap.size) {
    body.innerHTML = '<div class="empty-state">No cards in this view yet — open some boxes!</div>';
    return;
  }
  const sortedKeys = [...groupsMap.keys()].sort();
  for (const key of sortedKeys) {
    const section = document.createElement('div');
    section.className = 'mt-16';
    const title = document.createElement('div');
    title.className = 'panel-title';
    title.style.fontSize = '13px';
    title.textContent = `${key} (${groupsMap.get(key).length})`;
    section.appendChild(title);
    const grid = document.createElement('div');
    grid.className = 'card-grid';
    groupsMap.get(key).forEach(card => {
      grid.appendChild(cardTileEl(card, {
        onClick: (c) => openCardModal(game, c, { context: 'binder' }),
        valueOverride: game.cardValue(card),
      }));
    });
    section.appendChild(grid);
    body.appendChild(section);
  }
}

function groupOwnedCardsLocal(state, groupBy) {
  const groups = new Map();
  for (const card of state.ownedCards) {
    let key;
    switch (groupBy) {
      case 'player': key = card.playerName; break;
      case 'year': key = String(card.rookieYear); break;
      case 'parallel': key = card.category === 'finish' ? card.typeLabel : null; break;
      case 'numbered': key = card.category === 'numbered' ? card.typeLabel : null; break;
      case 'insert': key = card.category === 'insert' ? card.typeLabel : null; break;
      case 'auto': key = card.category === 'signature' ? card.typeLabel : null; break;
      case 'rarity': key = card.rarityLabel; break;
      default: key = 'All Cards';
    }
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(card);
  }
  return groups;
}
