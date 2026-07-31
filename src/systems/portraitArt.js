// Procedural player art: a large cel-shaded "helmeted bust" illustration —
// glossy team-colored helmet with facemask and tinted visor, striped
// shoulder pads, jersey number — over a comic burst background. Every
// visual trait derives deterministically from a hash of the player id, so
// the same player always renders identically everywhere, forever, with no
// stored assets. Traits are memoized per id; SVG markup is assembled fresh
// per call because inline gradient ids must stay unique per DOM instance
// (the same player can be on screen twice, e.g. duplicates in the binder).

import { hashString, mulberry32, pick, randInt } from '../utils/rng.js';
import { getTeam } from '../data/teams.js';

let idCounter = 0;
function uniqueId(prefix) { idCounter += 1; return `${prefix}${idCounter}`; }

const SKIN_TONES = ['#f1c9a5', '#e0ac69', '#c68642', '#9c6b3f', '#7a4f2a', '#5c3a21'];
const FACEMASK_STYLES = ['two_bar', 'three_bar', 'cage'];
const HELMET_FINISH = ['gloss', 'matte', 'metallic'];

const traitsCache = new Map();
function buildPlayerTraits(player) {
  const rng = mulberry32(hashString(player.id));
  const line = ['OT', 'OG', 'C', 'DT', 'DE'].includes(player.position);
  const skill = ['WR', 'CB', 'S', 'K', 'P', 'RB'].includes(player.position);
  return {
    skinTone: pick(rng, SKIN_TONES),
    facemask: pick(rng, FACEMASK_STYLES),
    finish: pick(rng, HELMET_FINISH),
    jerseyNumber: randInt(rng, 1, 99),
    tilt: randInt(rng, -5, 5),
    padWidth: line ? 96 : skill ? 78 : 86,
    visorTint: rng() < 0.7 ? 'dark' : 'chrome',
    stripeStyle: randInt(rng, 0, 2), // 0 none, 1 single, 2 double
  };
}
export function getPlayerTraits(player) {
  if (!traitsCache.has(player.id)) traitsCache.set(player.id, buildPlayerTraits(player));
  return traitsCache.get(player.id);
}

// --- Team emblem ---------------------------------------------------------
const logoCache = new Map();
const LOGO_SHAPES = ['shield', 'circle', 'diamond', 'talon'];
const LOGO_ACCENTS = ['stripe', 'bolt', 'star', 'wave'];
function buildTeamLogoTraits(team) {
  const rng = mulberry32(hashString(team.id));
  return {
    shape: pick(rng, LOGO_SHAPES),
    accent: pick(rng, LOGO_ACCENTS),
    initials: team.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
  };
}
export function getTeamLogoTraits(team) {
  if (!logoCache.has(team.id)) logoCache.set(team.id, buildTeamLogoTraits(team));
  return logoCache.get(team.id);
}

const SHAPE_PATHS = {
  shield: 'M50 4 L90 20 L90 55 Q90 85 50 98 Q10 85 10 55 L10 20 Z',
  circle: 'M50 4 A46 46 0 1 1 49.9 4 Z',
  diamond: 'M50 2 L98 50 L50 98 L2 50 Z',
  talon: 'M50 6 L84 30 L70 96 L30 96 L16 30 Z',
};

function logoAccentShape(kind, color) {
  switch (kind) {
    case 'bolt': return `<path d="M 54 20 L 38 52 L 48 52 L 42 78 L 64 44 L 52 44 Z" fill="${color}" />`;
    case 'star': return `<path d="M50 22 L57 42 L78 42 L61 55 L67 76 L50 63 L33 76 L39 55 L22 42 L43 42 Z" fill="${color}" />`;
    case 'wave': return `<path d="M 20 55 Q 35 40 50 55 T 80 55 L 80 68 Q 65 53 50 68 T 20 68 Z" fill="${color}" />`;
    default: return `<rect x="20" y="46" width="60" height="10" fill="${color}" transform="rotate(-18 50 50)" />`;
  }
}

/** Original geometric team emblem badge. */
export function renderTeamLogoSVG(team, { size = 64 } = {}) {
  const traits = getTeamLogoTraits(team);
  const primary = team?.colors?.[0] || '#2a3242';
  const secondary = team?.colors?.[1] || '#4b92db';
  const uid = uniqueId('l');
  const grad = `lg${uid}`;
  const clip = `lc${uid}`;
  const shapePath = SHAPE_PATHS[traits.shape] || SHAPE_PATHS.circle;

  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${grad}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${primary}" />
        <stop offset="100%" stop-color="${secondary}" />
      </linearGradient>
      <clipPath id="${clip}"><path d="${shapePath}" /></clipPath>
    </defs>
    <path d="${shapePath}" fill="url(#${grad})" stroke="#00000033" stroke-width="2" />
    <g clip-path="url(#${clip})" opacity="0.9">${logoAccentShape(traits.accent, '#ffffff2e')}</g>
    <text x="50" y="60" font-family="Arial, sans-serif" font-weight="800" font-size="32" fill="#ffffff" text-anchor="middle" stroke="#00000040" stroke-width="0.5">${traits.initials}</text>
  </svg>`;
}

// --- Facemask variants ---------------------------------------------------
function facemaskBars(style, color) {
  const bar = (d) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="3.4" stroke-linecap="round" />`;
  const shade = (d) => `<path d="${d}" fill="none" stroke="#00000030" stroke-width="1.2" stroke-linecap="round" transform="translate(0.6 1)" />`;
  let bars = '';
  // horizontal bars wrapping the face opening
  bars += bar('M 26 56 Q 50 64 74 56');
  bars += shade('M 26 56 Q 50 64 74 56');
  if (style !== 'two_bar') {
    bars += bar('M 27 64 Q 50 72 73 64');
    bars += shade('M 27 64 Q 50 72 73 64');
  }
  if (style === 'cage') {
    bars += bar('M 34 50 L 32 70');
    bars += bar('M 66 50 L 68 70');
  }
  // side connectors up to the shell
  bars += bar('M 27 55 L 29 46');
  bars += bar('M 73 55 L 71 46');
  return bars;
}

/**
 * Cel-shaded helmeted bust in team colors over a comic burst backdrop.
 * The visor hides the face entirely, so identity comes from helmet decal,
 * number, build, skin tone (neck/jaw), tilt, and mask/finish variants.
 */
export function renderPortraitSVG(playerLike, { width = 200, height = 240 } = {}) {
  const traits = getPlayerTraits(playerLike);
  const team = getTeam(playerLike.teamId);
  const primary = team?.colors?.[0] || '#2a3242';
  let secondary = team?.colors?.[1] || '#4b92db';
  // Contrast guard: a near-black secondary disappears against the dark
  // backdrop (and against a dark primary shell), so brighten it for accents.
  if (luminance(secondary) < 0.16) secondary = lighten(secondary, 0.55);
  const logoTraits = team ? getTeamLogoTraits(team) : { shape: 'circle', accent: 'stripe', initials: 'GB' };
  const decalPath = SHAPE_PATHS[logoTraits.shape] || SHAPE_PATHS.circle;
  const uid = uniqueId('p');
  const shellGrad = `sg${uid}`;
  const visorGrad = `vg${uid}`;
  const jerseyGrad = `jg${uid}`;
  const rayGrad = `rg${uid}`;
  const maskColor = traits.finish === 'metallic' ? '#d8dde5' : '#e8ecf2';
  const half = traits.padWidth / 2;

  // 12 burst rays around the helmet
  let rays = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.13;
    const x1 = 50 + Math.cos(a) * 18, y1 = 46 + Math.sin(a) * 18;
    const x2 = 50 + Math.cos(a) * 95, y2 = 46 + Math.sin(a) * 95;
    const w = i % 2 ? 5 : 9;
    rays += `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="url(#${rayGrad})" stroke-width="${w}" stroke-linecap="round" />`;
  }

  const stripe = traits.stripeStyle === 0 ? '' : traits.stripeStyle === 1
    ? `<path d="M 47 12 Q 50 10 53 12 L 53 40 L 47 40 Z" fill="${secondary}" opacity="0.95" />`
    : `<path d="M 44 13 L 47 12 L 47 40 L 44 40 Z" fill="${secondary}" opacity="0.95" />
       <path d="M 53 12 L 56 13 L 56 40 L 53 40 Z" fill="${secondary}" opacity="0.95" />`;

  const visorFill = traits.visorTint === 'dark'
    ? `url(#${visorGrad})`
    : `url(#${visorGrad})`;
  const visorOpacity = traits.visorTint === 'dark' ? 0.94 : 0.85;

  return `<svg viewBox="0 0 100 120" width="${width}" height="${height}" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${shellGrad}" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stop-color="${lighten(primary, 0.35)}" />
        <stop offset="55%" stop-color="${primary}" />
        <stop offset="100%" stop-color="${darken(primary, 0.35)}" />
      </linearGradient>
      <linearGradient id="${visorGrad}" x1="0" y1="0" x2="0" y2="1">
        ${traits.visorTint === 'dark'
          ? `<stop offset="0%" stop-color="#3a4150" /><stop offset="100%" stop-color="#05070c" />`
          : `<stop offset="0%" stop-color="#fce9b8" /><stop offset="45%" stop-color="#c26bd4" /><stop offset="100%" stop-color="#1c2f5e" />`}
      </linearGradient>
      <linearGradient id="${jerseyGrad}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${lighten(primary, 0.15)}" />
        <stop offset="100%" stop-color="${darken(primary, 0.3)}" />
      </linearGradient>
      <radialGradient id="${rayGrad}" cx="50%" cy="40%" r="80%">
        <stop offset="0%" stop-color="${secondary}" stop-opacity="0.5" />
        <stop offset="100%" stop-color="${secondary}" stop-opacity="0.06" />
      </radialGradient>
    </defs>

    <!-- backdrop: dark field + burst rays + halftone corner -->
    <rect x="0" y="0" width="100" height="120" fill="${darken(primary, 0.72)}" />
    ${rays}
    <g fill="${secondary}" opacity="0.18">
      ${halftone(6, 6, 34, 30, 5)}
      ${halftone(66, 88, 30, 28, 5)}
    </g>

    <g transform="rotate(${traits.tilt} 50 60)">
      <!-- shoulder pads + jersey -->
      <path d="M ${50 - half} 120 L ${50 - half + 2} 96 Q ${50 - half + 6} 84 ${50 - 16} 80 L ${50 + 16} 80 Q ${50 + half - 6} 84 ${50 + half - 2} 96 L ${50 + half} 120 Z" fill="url(#${jerseyGrad})" stroke="${darken(primary, 0.55)}" stroke-width="1.2" />
      <!-- pad caps -->
      <path d="M ${50 - half + 1} 97 Q ${50 - half + 3} 85 ${50 - 18} 81 L ${50 - 14} 92 Q ${50 - half + 10} 95 ${50 - half + 7} 104 Z" fill="${secondary}" opacity="0.9" />
      <path d="M ${50 + half - 1} 97 Q ${50 + half - 3} 85 ${50 + 18} 81 L ${50 + 14} 92 Q ${50 + half - 10} 95 ${50 + half - 7} 104 Z" fill="${secondary}" opacity="0.9" />
      <!-- collar + neck -->
      <path d="M 40 84 Q 50 90 60 84 L 60 78 L 40 78 Z" fill="${darken(primary, 0.5)}" />
      <rect x="43" y="70" width="14" height="12" rx="3" fill="${traits.skinTone}" />
      <rect x="43" y="70" width="14" height="4" fill="#00000022" />
      <!-- jersey number -->
      <text x="50" y="104" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle" stroke="${darken(primary, 0.6)}" stroke-width="0.7">${traits.jerseyNumber}</text>

      <!-- helmet shell -->
      <path d="M 26 46 Q 24 14 50 12 Q 76 14 74 46 L 74 52 Q 74 58 68 58 L 66 50 Q 60 54 50 54 Q 40 54 34 50 L 32 58 Q 26 58 26 52 Z" fill="url(#${shellGrad})" stroke="${darken(primary, 0.55)}" stroke-width="1.4" />
      ${stripe}
      <!-- shell gloss -->
      <path d="M 30 26 Q 34 15 46 13 Q 36 20 33 32 Z" fill="#ffffff" opacity="${traits.finish === 'matte' ? 0.18 : 0.45}" />
      <!-- ear hole + side decal -->
      <circle cx="31" cy="47" r="2.2" fill="${darken(primary, 0.6)}" />
      <g transform="translate(58 34) scale(0.16) translate(-50 -50)">
        <path d="${decalPath}" fill="${secondary}" stroke="#ffffff55" stroke-width="6" />
      </g>

      <!-- face opening: shadow + visor -->
      <path d="M 32 44 Q 32 60 40 66 Q 50 71 60 66 Q 68 60 68 44 Q 60 40 50 40 Q 40 40 32 44 Z" fill="#0a0c11" />
      <path d="M 33 45 Q 33 56 40 61 Q 50 66 60 61 Q 67 56 67 45 Q 58 41.5 50 41.5 Q 42 41.5 33 45 Z" fill="${visorFill}" opacity="${visorOpacity}" />
      <path d="M 35 46 Q 44 43.5 56 44.5 Q 50 49 38 50 Z" fill="#ffffff" opacity="0.35" />

      <!-- jaw below visor -->
      <path d="M 40 64 Q 50 70 60 64 L 58 70 Q 50 74 42 70 Z" fill="${traits.skinTone}" />
      <!-- chin strap -->
      <path d="M 42 69 Q 50 74 58 69" fill="none" stroke="${maskColor}" stroke-width="2.4" stroke-linecap="round" />

      ${facemaskBars(traits.facemask, maskColor)}

      <!-- rim light -->
      <path d="M 73 22 Q 76 34 74 46" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.5" stroke-linecap="round" />
    </g>

    <!-- soft vignette -->
    <rect x="0" y="0" width="100" height="120" fill="url(#${rayGrad})" opacity="0.12" />
  </svg>`;
}

// --- tiny color helpers (hex only, clamps at bounds) --------------------
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function lighten(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt]);
}
function darken(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([r * (1 - amt), g * (1 - amt), b * (1 - amt)]);
}
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
function halftone(x0, y0, w, h, step) {
  let out = '';
  for (let y = y0; y < y0 + h; y += step) {
    for (let x = x0; x < x0 + w; x += step) {
      const r = 1.5 - ((x + y) % (step * 2) === 0 ? 0.4 : 0);
      out += `<circle cx="${x}" cy="${y}" r="${r}" />`;
    }
  }
  return out;
}
