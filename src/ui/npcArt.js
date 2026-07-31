// Procedural walk-in customer sprites for the card shop scene: a friendly
// flat-illustration person (head, hair, torso, accessories) seeded from
// the customer's appearanceSeed so the same customer always looks the same
// during a shift.

import { mulberry32, pick } from '../utils/rng.js';

const SKIN = ['#f1c9a5', '#e0ac69', '#c68642', '#9c6b3f', '#7a4f2a', '#5c3a21'];
const HAIR = ['#0b0b0b', '#2b1a10', '#4a2e18', '#6b4423', '#a9a9a9', '#d8d8d8', '#8a3324'];
const SHIRT = ['#4b92db', '#c8443c', '#3f8f5a', '#7a52c7', '#e0722c', '#3aa6a0', '#b03a52', '#5c6b7a'];
const HAIRSTYLE = ['short', 'curly', 'long', 'bald', 'bun'];

let idCounter = 0;

export function renderNpcSVG(seed, { width = 150, height = 190 } = {}) {
  const rng = mulberry32(seed >>> 0);
  const skin = pick(rng, SKIN);
  const hair = pick(rng, HAIR);
  const shirt = pick(rng, SHIRT);
  const style = pick(rng, HAIRSTYLE);
  const hasCap = rng() < 0.3;
  const hasGlasses = rng() < 0.28;
  const hasBeard = rng() < 0.3;
  idCounter += 1;
  const g = `npc${idCounter}`;

  const hairShape = hasCap ? '' : {
    short: `<path d="M 32 34 Q 50 16 68 34 L 68 44 Q 50 30 32 44 Z" fill="${hair}" />`,
    curly: `<g fill="${hair}"><circle cx="36" cy="32" r="9"/><circle cx="50" cy="26" r="10"/><circle cx="64" cy="32" r="9"/></g>`,
    long: `<path d="M 30 34 Q 50 14 70 34 L 72 66 L 62 62 L 62 44 Q 50 34 38 44 L 38 62 L 28 66 Z" fill="${hair}" />`,
    bald: '',
    bun: `<path d="M 33 34 Q 50 18 67 34 L 67 42 Q 50 30 33 42 Z" fill="${hair}" /><circle cx="50" cy="16" r="7" fill="${hair}" />`,
  }[style] || '';

  const cap = hasCap ? `
    <path d="M 31 34 Q 50 14 69 34 L 69 40 L 31 40 Z" fill="${pick(rng, SHIRT)}" />
    <path d="M 28 38 L 72 38 L 76 44 L 24 44 Z" fill="#00000055" />` : '';

  const glasses = hasGlasses ? `
    <g stroke="#1a1a1a" stroke-width="2" fill="none">
      <circle cx="42" cy="48" r="6" /><circle cx="58" cy="48" r="6" /><path d="M 48 48 L 52 48" />
    </g>` : '';

  const beard = hasBeard ? `<path d="M 36 56 Q 50 76 64 56 L 62 66 Q 50 78 38 66 Z" fill="${hair}" />` : '';

  return `<svg viewBox="0 0 100 130" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sh${g}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${shirt}" />
        <stop offset="100%" stop-color="#00000066" />
      </linearGradient>
    </defs>
    <!-- torso -->
    <path d="M 22 130 Q 22 92 38 86 L 50 92 L 62 86 Q 78 92 78 130 Z" fill="url(#sh${g})" />
    <!-- arms hugging a card box? keep simple -->
    <!-- neck + head -->
    <rect x="44" y="66" width="12" height="14" fill="${skin}" />
    <circle cx="50" cy="48" r="20" fill="${skin}" />
    ${hairShape}
    ${cap}
    <!-- eyes + brows + mouth -->
    <circle cx="43" cy="48" r="2" fill="#1a1a1a" />
    <circle cx="57" cy="48" r="2" fill="#1a1a1a" />
    ${glasses}
    <path d="M 39 42 L 46 42" stroke="${hair}" stroke-width="1.6" stroke-linecap="round" />
    <path d="M 54 42 L 61 42" stroke="${hair}" stroke-width="1.6" stroke-linecap="round" />
    <path d="M 44 58 Q 50 62 56 58" stroke="#00000088" stroke-width="1.6" fill="none" stroke-linecap="round" />
    ${beard}
  </svg>`;
}
