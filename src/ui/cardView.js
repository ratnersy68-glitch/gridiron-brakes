import { getTeam } from '../data/teams.js';
import { money } from '../utils/format.js';

const GLOW_RARITIES = new Set(['rare', 'epic', 'legendary', 'mythic', 'impossible', 'oneofone']);

export function cardTileEl(card, { onClick, valueOverride, showValue = true } = {}) {
  const el = document.createElement('div');
  const team = getTeam(card.teamId);
  el.className = 'card-tile';
  if (GLOW_RARITIES.has(card.rarityKey)) el.classList.add(`glow-${card.rarityKey}`);
  if (card.favorite) el.classList.add('favorite');
  if (card.locked) el.classList.add('locked');

  const strip = document.createElement('div');
  strip.className = 'team-strip';
  strip.style.background = `linear-gradient(90deg, ${team?.colors?.[0] || '#333'}, ${team?.colors?.[1] || '#666'})`;
  el.appendChild(strip);

  const posBadge = document.createElement('div');
  posBadge.className = 'position-badge';
  posBadge.textContent = card.position;
  el.appendChild(posBadge);

  const nameEl = document.createElement('div');
  nameEl.className = 'player-name';
  nameEl.textContent = card.playerName;
  el.appendChild(nameEl);

  const teamEl = document.createElement('div');
  teamEl.className = 'team-name';
  teamEl.textContent = team?.name || '';
  el.appendChild(teamEl);

  const typeEl = document.createElement('div');
  typeEl.className = 'type-label';
  typeEl.style.color = card.rarityColor;
  typeEl.textContent = card.typeLabel + (card.isRookie ? ' • RC' : '');
  el.appendChild(typeEl);

  if (card.serial) {
    const serialEl = document.createElement('div');
    serialEl.className = 'serial';
    serialEl.textContent = `#${card.serial} / ${card.printRun}`;
    el.appendChild(serialEl);
  }

  if (showValue) {
    const valueEl = document.createElement('div');
    valueEl.className = 'value-chip';
    valueEl.textContent = money(valueOverride ?? card.marketValue ?? card.baseValue);
    el.appendChild(valueEl);
  }

  const rarityTag = document.createElement('div');
  rarityTag.className = 'rarity-tag';
  rarityTag.style.color = card.rarityColor;
  rarityTag.textContent = card.rarityLabel;
  el.appendChild(rarityTag);

  if (onClick) el.addEventListener('click', () => onClick(card, el));
  return el;
}

export function silhouetteTileEl(player) {
  const el = document.createElement('div');
  el.className = 'card-tile silhouette';
  const posBadge = document.createElement('div');
  posBadge.className = 'position-badge';
  posBadge.textContent = player.position;
  el.appendChild(posBadge);
  const nameEl = document.createElement('div');
  nameEl.className = 'player-name';
  nameEl.textContent = player.name;
  el.appendChild(nameEl);
  return el;
}
