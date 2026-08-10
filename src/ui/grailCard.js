// Grail card rendering. These are deliberately in a different visual class
// from every other card in the game: a live animated backdrop, an ornate
// double frame, drifting sparkle motes, a rotating prismatic sheen, an
// engraved nameplate, and a slow float. Each theme layers its own animated
// background on top of that shared chassis.

import { getTeam } from '../data/teams.js';
import { grailPlayer } from '../data/grails.js';
import { renderPortraitSVG, renderTeamLogoSVG } from '../systems/portraitArt.js';
import { money } from '../utils/format.js';

const SPARKLE_COUNT = 14;

function sparkleLayer() {
  const layer = document.createElement('div');
  layer.className = 'grail-sparkles';
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const s = document.createElement('span');
    // Spread deterministically enough to look scattered but stay cheap.
    s.style.left = `${(i * 37) % 100}%`;
    s.style.top = `${(i * 61) % 100}%`;
    s.style.animationDelay = `${(i * 0.37) % 4}s`;
    s.style.animationDuration = `${2.6 + (i % 5) * 0.5}s`;
    layer.appendChild(s);
  }
  return layer;
}

/**
 * @param {object} grail definition from data/grails.js
 * @param {object} opts.owned show the owned nameplate rather than a price
 */
export function grailCardEl(grail, { owned = false, onClick } = {}) {
  const player = grailPlayer(grail);
  const team = getTeam(player.teamId);

  const card = document.createElement('div');
  card.className = `grail-card ${grail.theme}`;
  card.style.setProperty('--grail-accent', grail.accent);

  const bg = document.createElement('div');
  bg.className = 'grail-bg';
  card.appendChild(bg);

  const rays = document.createElement('div');
  rays.className = 'grail-rays';
  card.appendChild(rays);

  const portrait = document.createElement('div');
  portrait.className = 'grail-portrait';
  portrait.innerHTML = renderPortraitSVG(player, { width: 240, height: 290 });
  card.appendChild(portrait);

  card.appendChild(sparkleLayer());

  const sheen = document.createElement('div');
  sheen.className = 'grail-sheen';
  card.appendChild(sheen);

  const frame = document.createElement('div');
  frame.className = 'grail-frame';
  card.appendChild(frame);

  const crest = document.createElement('div');
  crest.className = 'grail-crest';
  crest.innerHTML = team ? renderTeamLogoSVG(team, { size: 34 }) : '';
  card.appendChild(crest);

  const oneOfOne = document.createElement('div');
  oneOfOne.className = 'grail-serial';
  oneOfOne.textContent = '1 / 1';
  card.appendChild(oneOfOne);

  const plate = document.createElement('div');
  plate.className = 'grail-plate';
  plate.innerHTML = `
    <div class="grail-tier">${grail.name}</div>
    <div class="grail-name">${player.name}</div>
    <div class="grail-meta">${player.position} &bull; ${team?.name || ''}</div>
    <div class="grail-price">${owned ? 'IN YOUR VAULT' : money(grail.price)}</div>`;
  card.appendChild(plate);

  if (onClick) card.addEventListener('click', () => onClick(grail, card));
  return card;
}
