// Branded product visuals modeled on real hobby box design language: a
// hero star player front-and-center, a big chrome-foil product wordmark,
// the year + line name, printed guarantee text ("2 AUTOS PER BOX"), a
// packs/cards config strip along the bottom, a holo authenticity seal, and
// a shaded side panel. Pack wrappers reuse the same hero + wordmark over
// metallic foil with crimped ends. All fictional, tinted per product line.

import { CURATED_PLAYERS } from '../data/players.js';
import { renderPortraitSVG } from '../systems/portraitArt.js';
import { hashString } from '../utils/rng.js';

let idCounter = 0;
function uid(p) { idCounter += 1; return `${p}${idCounter}`; }

// Each product line features a fixed cover athlete (seeded, stable forever).
export function coverAthleteFor(box) {
  return CURATED_PLAYERS[hashString('cover::' + box.key) % CURATED_PLAYERS.length];
}

function guaranteeLine(box) {
  const sig = (box.guarantees || []).find(g => g.type === 'signature');
  const num = (box.guarantees || []).find(g => g.type === 'numbered');
  const one = (box.guarantees || []).find(g => g.type === 'oneofone');
  if (one) return `1 ONE-OF-ONE + ${sig ? sig.count + ' AUTOS' : 'HITS'} PER BOX`;
  if (sig) return `${sig.count} AUTO${sig.count > 1 ? 'S' : ''} PER BOX ON AVERAGE`;
  if (num) return `${num.count} NUMBERED PARALLEL${num.count > 1 ? 'S' : ''} PER BOX`;
  return 'FIND RARE PARALLELS & INSERTS';
}

export function renderBoxArtSVG(box, { width = 170, height = 128 } = {}) {
  const { hue1, hue2 } = box.art || { hue1: '#3a4657', hue2: '#141a24' };
  const g = uid('bx');
  const hero = coverAthleteFor(box);
  const heroSVG = renderPortraitSVG(hero, { width: 64, height: 77 });
  const brandShort = box.brand.length > 14 ? box.brand.slice(0, 13) + '…' : box.brand;

  return `<svg viewBox="0 0 170 128" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="f${g}" x1="0" y1="0" x2="0.85" y2="1">
        <stop offset="0%" stop-color="${hue1}" />
        <stop offset="100%" stop-color="${hue2}" />
      </linearGradient>
      <linearGradient id="s${g}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${hue2}" />
        <stop offset="100%" stop-color="#04060a" />
      </linearGradient>
      <linearGradient id="chrome${g}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="45%" stop-color="#c9d2de" />
        <stop offset="55%" stop-color="#8593a5" />
        <stop offset="100%" stop-color="#e8edf4" />
      </linearGradient>
      <linearGradient id="foil${g}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.03" />
        <stop offset="45%" stop-color="#fff" stop-opacity="0.5" />
        <stop offset="55%" stop-color="#fff" stop-opacity="0.14" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0.03" />
      </linearGradient>
      <clipPath id="hero${g}"><rect x="104" y="26" width="52" height="78" rx="3" /></clipPath>
    </defs>

    <!-- side panel -->
    <path d="M 158 16 L 168 24 L 168 116 L 158 122 Z" fill="url(#s${g})" stroke="#00000066" stroke-width="1" />
    <!-- front panel -->
    <rect x="4" y="12" width="154" height="110" rx="3" fill="url(#f${g})" stroke="#00000070" stroke-width="1.2" />
    <!-- top lid lip -->
    <path d="M 4 12 L 158 12 L 168 24 L 14 24 Z" fill="${hue1}" stroke="#00000044" stroke-width="1" />
    <path d="M 4 12 L 158 12 L 168 24 L 14 24 Z" fill="#ffffff26" />

    <!-- dramatic burst behind hero -->
    <g opacity="0.5">
      <path d="M 130 62 L 90 30 L 150 52 Z" fill="#ffffff12" />
      <path d="M 130 62 L 170 34 L 158 70 Z" fill="#ffffff10" />
      <path d="M 130 62 L 100 110 L 146 104 Z" fill="#ffffff0d" />
    </g>

    <!-- hero athlete window -->
    <g clip-path="url(#hero${g})">
      <rect x="104" y="26" width="52" height="78" fill="${hue2}" />
      <g transform="translate(98 26)">${heroSVG}</g>
    </g>
    <rect x="104" y="26" width="52" height="78" rx="3" fill="none" stroke="#ffffff33" stroke-width="1" />

    <!-- chrome wordmark -->
    <text x="12" y="46" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="17" fill="url(#chrome${g})" stroke="#0a0d14" stroke-width="0.6" letter-spacing="0.5">${brandShort.toUpperCase()}</text>
    <rect x="12" y="50" width="84" height="2.4" fill="url(#foil${g})" />

    <!-- year + line -->
    <text x="12" y="62" font-family="Arial, sans-serif" font-weight="800" font-size="8" fill="#ffffffd9">2026 AGL FOOTBALL</text>
    <text x="12" y="74" font-family="Arial, sans-serif" font-weight="700" font-size="8.6" fill="#ffffffef">${box.name.toUpperCase()}</text>

    <!-- printed guarantee text -->
    <text x="12" y="90" font-family="Arial, sans-serif" font-weight="800" font-size="5.8" fill="#ffe9b0" letter-spacing="0.3">${guaranteeLine(box)}</text>

    <!-- config strip -->
    <rect x="4" y="106" width="154" height="16" fill="#04060acc" />
    <text x="12" y="116.5" font-family="Arial, sans-serif" font-weight="700" font-size="6.4" fill="#ffffffb8" letter-spacing="0.4">${box.packCount} PACKS • ${box.cardsPerPack} CARDS PER PACK • HOBBY EXCLUSIVE</text>

    <!-- holo authenticity seal -->
    <g transform="translate(146 96)">
      <circle r="7.2" fill="#ffffff" opacity="0.92" />
      <circle r="7.2" fill="url(#foil${g})" />
      <circle r="7.2" fill="none" stroke="${hue2}" stroke-width="1" />
      <text y="2.4" font-family="Arial, sans-serif" font-weight="900" font-size="5" fill="${hue2}" text-anchor="middle">AGL</text>
    </g>

    <!-- foil sweep across the whole front -->
    <rect x="4" y="12" width="154" height="110" rx="3" fill="url(#foil${g})" opacity="0.25" />
  </svg>`;
}

export function boxArtEl(box, opts = {}) {
  const el = document.createElement('div');
  el.className = 'product-box-art';
  el.innerHTML = renderBoxArtSVG(box, opts);
  return el;
}

export function renderPackArtSVG(box, { width = 82, height = 118 } = {}) {
  const { hue1, hue2 } = box.art || { hue1: '#2e6fb0', hue2: '#123a63' };
  const g = uid('pk');
  const hero = coverAthleteFor(box);
  const heroSVG = renderPortraitSVG(hero, { width: 54, height: 65 });
  return `<svg viewBox="0 0 82 118" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="w${g}" x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stop-color="${hue1}" />
        <stop offset="60%" stop-color="${hue2}" />
        <stop offset="100%" stop-color="#04060a" />
      </linearGradient>
      <linearGradient id="foil${g}" x1="0" y1="0" x2="1" y2="0.15">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.05" />
        <stop offset="45%" stop-color="#fff" stop-opacity="0.55" />
        <stop offset="55%" stop-color="#fff" stop-opacity="0.15" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0.05" />
      </linearGradient>
      <clipPath id="hp${g}"><rect x="12" y="30" width="58" height="62" rx="3" /></clipPath>
    </defs>

    <!-- wrapper body -->
    <rect x="2" y="8" width="78" height="102" rx="3" fill="url(#w${g})" stroke="#00000070" stroke-width="1" />
    <!-- crimped ends -->
    <g fill="#ffffff2e">
      ${Array.from({ length: 13 }, (_, i) => `<rect x="${3 + i * 6}" y="2" width="3" height="9" rx="1" />`).join('')}
      ${Array.from({ length: 13 }, (_, i) => `<rect x="${3 + i * 6}" y="107" width="3" height="9" rx="1" />`).join('')}
    </g>
    <rect x="2" y="8" width="78" height="4" fill="#00000045" />
    <rect x="2" y="106" width="78" height="4" fill="#00000045" />

    <!-- hero window -->
    <g clip-path="url(#hp${g})">
      <rect x="12" y="30" width="58" height="62" fill="${hue2}" />
      <g transform="translate(14 30)">${heroSVG}</g>
    </g>

    <!-- wordmark -->
    <text x="41" y="24" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="10" fill="#ffffff" text-anchor="middle" stroke="#0a0d14" stroke-width="0.5" letter-spacing="0.6">${box.brand.toUpperCase().slice(0, 12)}</text>

    <!-- bottom text -->
    <text x="41" y="101" font-family="Arial, sans-serif" font-weight="800" font-size="5.6" fill="#ffffffcc" text-anchor="middle" letter-spacing="0.4">${box.cardsPerPack} CARDS • 2026 AGL</text>

    <!-- foil sheen -->
    <rect x="2" y="8" width="78" height="102" rx="3" fill="url(#foil${g})" opacity="0.5" />
  </svg>`;
}

export function stylePackEl(packEl, box) {
  packEl.classList.add('pack-foil-art');
  packEl.innerHTML = renderPackArtSVG(box);
}
