// Procedural player art: a geometric action-pose silhouette (pictogram
// style — think Olympic event icons, not a face) filled with a clean
// neutral tone, set in front of a large, bold, team-branded emblem. Every
// visual trait is derived deterministically from a hash of the player id,
// so the same player always renders with the same pose variant, and the
// same team always renders with the same emblem — forever, with zero
// storage needed. Traits are memoized once per id; the SVG markup itself
// is still assembled fresh on each call because inline gradient/clip ids
// must stay unique per DOM instance (duplicates of the same player can be
// on screen at once, e.g. in the binder).

import { hashString, mulberry32, pick, randInt } from '../utils/rng.js';
import { getTeam } from '../data/teams.js';

let idCounter = 0;
function uniqueId(prefix) { idCounter += 1; return `${prefix}${idCounter}`; }

// --- Position -> pose group -------------------------------------------
const POSE_GROUPS = {
  QB: 'throw',
  RB: 'run', FB: 'run',
  WR: 'catch', TE: 'catch',
  OT: 'block', OG: 'block', C: 'block',
  DE: 'rush', DT: 'rush',
  LB: 'ready',
  CB: 'coverage', S: 'coverage',
  K: 'kick', P: 'kick',
};

const traitsCache = new Map();
function buildPlayerTraits(player) {
  const rng = mulberry32(hashString(player.id));
  return {
    poseGroup: POSE_GROUPS[player.position] || 'ready',
    mirror: rng() < 0.5,
    jerseyNumber: randInt(rng, 0, 99),
    limbWidth: ['OT', 'OG', 'C', 'DT', 'DE'].includes(player.position) ? 15 : ['WR', 'CB', 'S', 'K', 'P'].includes(player.position) ? 10 : 12,
  };
}
export function getPlayerTraits(player) {
  if (!traitsCache.has(player.id)) traitsCache.set(player.id, buildPlayerTraits(player));
  return traitsCache.get(player.id);
}

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

/** Original geometric team emblem — never a real NFL logo shape. */
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

// --- Pose skeletons: thick-stroked limb chains + a filled head circle,
// drawn pictogram-style so no facial detail is needed. Coordinates are in
// a 0-100 (x) / 0-120 (y) box, mirrored horizontally when traits.mirror.
const POSES = {
  throw: {
    head: [50, 28],
    chains: [
      [[50, 44], [48, 78]],                          // spine
      [[48, 78], [40, 98], [36, 116]],                // front leg
      [[48, 78], [58, 92], [64, 110]],                // back leg
      [[56, 46], [72, 38], [84, 24]],                 // throwing arm, cocked back
      [[44, 46], [34, 54], [28, 66]],                 // off arm
    ],
    ball: [84, 20],
  },
  run: {
    head: [52, 30],
    chains: [
      [[52, 44], [50, 76]],
      [[50, 76], [40, 72], [34, 90]],                 // driving knee up
      [[50, 76], [64, 92], [76, 104]],                // trailing leg
      [[44, 46], [32, 42], [24, 34]],                 // pumping arm forward
      [[56, 46], [66, 58], [72, 70]],                 // trailing arm
    ],
    ball: [56, 68],
  },
  catch: {
    head: [50, 26],
    chains: [
      [[50, 40], [50, 74]],
      [[48, 74], [44, 94], [40, 112]],
      [[52, 74], [60, 92], [66, 108]],
      [[44, 42], [36, 26], [30, 10]],                 // arm reaching up
      [[56, 42], [64, 26], [70, 10]],                 // arm reaching up
    ],
    ball: [50, 4],
  },
  block: {
    head: [50, 32],
    chains: [
      [[50, 42], [50, 72]],
      [[42, 72], [34, 90], [30, 108]],
      [[58, 72], [66, 90], [70, 108]],
      [[40, 44], [28, 50], [18, 54]],                 // punching arm
      [[60, 44], [72, 50], [82, 54]],                 // punching arm
    ],
    ball: null,
  },
  rush: {
    head: [40, 40],
    chains: [
      [[46, 50], [56, 80]],
      [[58, 80], [68, 96], [76, 112]],
      [[50, 80], [42, 92], [36, 108]],
      [[38, 50], [30, 64], [24, 80]],                 // hand down, 3-point stance
      [[52, 50], [64, 52], [74, 48]],
    ],
    ball: null,
  },
  ready: {
    head: [50, 30],
    chains: [
      [[50, 42], [50, 72]],
      [[44, 72], [38, 90], [34, 108]],
      [[56, 72], [62, 90], [66, 108]],
      [[42, 46], [30, 48], [22, 42]],
      [[58, 46], [70, 48], [78, 42]],
    ],
    ball: null,
  },
  coverage: {
    head: [54, 32],
    chains: [
      [[52, 44], [48, 74]],
      [[46, 74], [36, 88], [28, 100]],
      [[50, 74], [60, 92], [70, 108]],
      [[58, 44], [70, 36], [80, 22]],                 // reaching arm
      [[42, 44], [34, 54], [28, 66]],
    ],
    ball: [80, 18],
  },
  kick: {
    head: [48, 28],
    chains: [
      [[48, 40], [52, 70]],
      [[52, 70], [66, 58], [80, 44]],                 // kicking leg swung high
      [[48, 70], [44, 92], [40, 110]],
      [[42, 42], [30, 44], [20, 48]],
      [[56, 42], [66, 40], [76, 36]],
    ],
    ball: [86, 38],
  },
};

function mirrorX(x) { return 100 - x; }

function chainPath(points, mirror) {
  const pts = points.map(([x, y]) => `${(mirror ? mirrorX(x) : x).toFixed(1)},${y.toFixed(1)}`);
  return `<path d="M ${pts.join(' L ')}" />`;
}

/** Renders the geometric action-pose silhouette + large team emblem card art. */
export function renderPortraitSVG(playerLike, { width = 200, height = 240 } = {}) {
  const traits = getPlayerTraits(playerLike);
  const team = getTeam(playerLike.teamId);
  const primary = team?.colors?.[0] || '#2a3242';
  const secondary = team?.colors?.[1] || '#4b92db';
  const pose = POSES[traits.poseGroup] || POSES.ready;
  const uid = uniqueId('p');
  const bgGrad = `bg${uid}`;
  const rimGrad = `rim${uid}`;
  const logoTraits = team ? getTeamLogoTraits(team) : { shape: 'circle', accent: 'stripe' };
  const shapePath = SHAPE_PATHS[logoTraits.shape] || SHAPE_PATHS.circle;
  const headX = (traits.mirror ? mirrorX(pose.head[0]) : pose.head[0]).toFixed(1);
  const headY = pose.head[1].toFixed(1);
  const ball = pose.ball ? [traits.mirror ? mirrorX(pose.ball[0]) : pose.ball[0], pose.ball[1]] : null;

  return `<svg viewBox="0 0 100 120" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="${bgGrad}" cx="50%" cy="38%" r="70%">
        <stop offset="0%" stop-color="${secondary}" stop-opacity="0.55" />
        <stop offset="100%" stop-color="${primary}" stop-opacity="0.85" />
      </radialGradient>
      <linearGradient id="${rimGrad}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#dfe3ea" />
      </linearGradient>
    </defs>

    <rect x="0" y="0" width="100" height="120" fill="url(#${bgGrad})" />

    <!-- large team emblem watermark, centered behind the pose -->
    <g transform="translate(50 58) scale(1.5) translate(-50 -50)" opacity="0.9">
      <path d="${shapePath}" fill="${primary}" opacity="0.55" />
      <path d="${shapePath}" fill="none" stroke="${secondary}" stroke-width="2.5" opacity="0.7" />
    </g>

    <!-- action-pose pictogram -->
    <g stroke="url(#${rimGrad})" stroke-width="${traits.limbWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.98">
      ${pose.chains.map(chain => chainPath(chain, traits.mirror)).join('')}
    </g>
    <circle cx="${headX}" cy="${headY}" r="9.5" fill="url(#${rimGrad})" />

    ${ball ? `<ellipse cx="${ball[0].toFixed(1)}" cy="${ball[1].toFixed(1)}" rx="4.2" ry="3" fill="#7a4a26" stroke="#4a2c14" stroke-width="0.6" transform="rotate(-25 ${ball[0].toFixed(1)} ${ball[1].toFixed(1)})" />` : ''}

    <!-- ground shadow -->
    <ellipse cx="50" cy="118" rx="26" ry="4" fill="#000000" opacity="0.25" />
  </svg>`;
}
