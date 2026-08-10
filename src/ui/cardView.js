import { getTeam } from '../data/teams.js';
import { money } from '../utils/format.js';
import { renderPortraitSVG, renderTeamLogoSVG } from '../systems/portraitArt.js';
import { resolveCardTemplate } from '../data/cardTemplates.js';
import { hashString } from '../utils/rng.js';
import { grailCardEl } from './grailCard.js';
import { getGrail } from '../data/grails.js';

const GLOW_RARITIES = new Set(['rare', 'epic', 'legendary', 'mythic', 'impossible', 'oneofone']);

function applyTemplateClasses(el, card) {
  const tmpl = resolveCardTemplate(card);
  el.classList.add(tmpl.border, tmpl.bg, tmpl.foil);
  return tmpl;
}

function buildCardFace(card, { showValue = true, valueOverride } = {}) {
  const team = getTeam(card.teamId);
  const face = document.createElement('div');
  face.className = 'card-face';

  const portrait = document.createElement('div');
  portrait.className = 'card-portrait';
  portrait.innerHTML = renderPortraitSVG({ id: card.playerId, position: card.position, teamId: card.teamId }, { width: 200, height: 240 });
  face.appendChild(portrait);

  const sweep = document.createElement('div');
  sweep.className = 'foil-sweep';
  portrait.appendChild(sweep);

  if (team) {
    const logo = document.createElement('div');
    logo.className = 'team-logo-badge';
    logo.innerHTML = renderTeamLogoSVG(team, { size: 32 });
    portrait.appendChild(logo);
  }

  if (typeof card.overall === 'number') {
    const rating = document.createElement('div');
    rating.className = 'rating-badge';
    rating.textContent = card.overall;
    portrait.appendChild(rating);
  }

  if (card.isRookie) {
    const rookie = document.createElement('div');
    rookie.className = 'rookie-badge';
    rookie.textContent = 'RC';
    portrait.appendChild(rookie);
  }

  const info = document.createElement('div');
  info.className = 'card-info';

  const nameRow = document.createElement('div');
  nameRow.className = 'player-name';
  nameRow.textContent = card.playerName;
  info.appendChild(nameRow);

  const metaRow = document.createElement('div');
  metaRow.className = 'team-name';
  metaRow.textContent = `${card.position} • ${team?.name || ''}`;
  info.appendChild(metaRow);

  const typeRow = document.createElement('div');
  typeRow.className = 'type-value-row';
  const typeEl = document.createElement('span');
  typeEl.className = 'type-label';
  typeEl.style.color = card.rarityColor;
  typeEl.textContent = card.typeLabel + (card.serial ? ` #${card.serial}/${card.printRun}` : '');
  typeRow.appendChild(typeEl);
  if (showValue) {
    const valueEl = document.createElement('span');
    valueEl.className = 'value-chip';
    valueEl.textContent = money(valueOverride ?? card.marketValue ?? card.baseValue);
    typeRow.appendChild(valueEl);
  }
  info.appendChild(typeRow);

  face.appendChild(info);
  return face;
}

export function cardNumberFor(card) {
  return (hashString(card.key) % 899) + 100;
}

function buildCardBackFace(card) {
  const team = getTeam(card.teamId);
  const back = document.createElement('div');
  back.className = 'card-back-design';
  const tmpl = resolveCardTemplate(card);
  back.classList.add(tmpl.bg, tmpl.border);

  const logoRow = document.createElement('div');
  logoRow.className = 'back-logo';
  logoRow.innerHTML = `${team ? renderTeamLogoSVG(team, { size: 20 }) : ''}<span>${tmpl.label}</span>`;
  back.appendChild(logoRow);

  const bio = document.createElement('div');
  bio.className = 'back-bio';
  const flavor = [
    `Drafted out of a small program, ${card.playerName} became a fixture for the ${card.teamName}.`,
    `${card.playerName} is known around the league for relentless film study and a knack for big moments.`,
    `A fan favorite in ${card.teamName.split(' ')[0]}, ${card.playerName} keeps rewriting the team record book.`,
    `${card.playerName} models a game built on discipline, footwork, and preparation.`,
  ];
  bio.textContent = flavor[hashString(card.playerId) % flavor.length];
  back.appendChild(bio);

  const stats = document.createElement('div');
  stats.className = 'back-stats';
  const ovr = card.overall ?? 70;
  const seed = hashString(card.key);
  const statPairs = [
    ['OVR', ovr],
    ['GP', 10 + (seed % 7)],
    ['SPD', Math.min(99, 55 + (seed % 40))],
    ['AWR', Math.min(99, 50 + ((seed >> 3) % 45))],
  ];
  statPairs.forEach(([label, val]) => {
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `<span>${label}</span><span>${val}</span>`;
    stats.appendChild(row);
  });
  back.appendChild(stats);

  const footer = document.createElement('div');
  footer.className = 'back-footer';
  const num = cardNumberFor(card);
  footer.innerHTML = `<span>No. ${num}${card.serial ? ` &bull; #${card.serial}/${card.printRun}` : ''}</span>`;
  const qr = document.createElement('canvas');
  qr.width = 26; qr.height = 26;
  qr.className = 'qr-deco';
  drawDecorativeGrid(qr, hashString(card.key + '::qr'));
  footer.appendChild(qr);
  back.appendChild(footer);

  return back;
}

function drawDecorativeGrid(canvas, seed) {
  const ctx = canvas.getContext('2d');
  const cells = 8;
  const size = canvas.width / cells;
  let s = seed >>> 0;
  const rand = () => { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 8) / 16777216; };
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e8ecf3';
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      if (rand() > 0.55) ctx.fillRect(x * size, y * size, size, size);
    }
  }
}

export function cardTileEl(card, { onClick, valueOverride, showValue = true } = {}) {
  // Grails never use the standard chassis — they get their own presentation
  // wherever they show up (binder pockets, modals, marketplace rows).
  if (card.category === 'grail') {
    const grail = getGrail(card.grailKey || card.typeKey);
    if (grail) {
      const grailEl = grailCardEl(grail, { owned: true });
      if (onClick) grailEl.addEventListener('click', () => onClick(card, grailEl));
      return grailEl;
    }
  }

  const el = document.createElement('div');
  el.className = 'card-tile';
  if (GLOW_RARITIES.has(card.rarityKey)) el.classList.add(`glow-${card.rarityKey}`);
  if (card.favorite) el.classList.add('favorite');
  if (card.locked) el.classList.add('locked');
  applyTemplateClasses(el, card);
  el.appendChild(buildCardFace(card, { showValue, valueOverride }));
  if (onClick) el.addEventListener('click', () => onClick(card, el));
  return el;
}

export function cardBackEl(card) {
  return buildCardBackFace(card);
}

export function silhouetteTileEl(player) {
  const el = document.createElement('div');
  el.className = 'card-tile silhouette';
  const posBadge = document.createElement('div');
  posBadge.className = 'position-badge';
  posBadge.style.position = 'absolute';
  posBadge.style.top = '8px';
  posBadge.style.left = '8px';
  posBadge.textContent = player.position;
  el.appendChild(posBadge);
  const nameEl = document.createElement('div');
  nameEl.className = 'player-name';
  nameEl.style.position = 'absolute';
  nameEl.style.bottom = '8px';
  nameEl.style.left = '8px';
  nameEl.style.right = '8px';
  nameEl.textContent = player.name;
  el.appendChild(nameEl);
  return el;
}
