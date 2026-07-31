// Branded product visuals: a pseudo-3D hobby box (front + side panel, foil
// band, holo sticker, brand wordmark) and matching foil pack wrappers, all
// tinted from the box's art palette so every product line is instantly
// recognizable on the shelf and in the opening ritual.

let idCounter = 0;
function uid(p) { idCounter += 1; return `${p}${idCounter}`; }

export function renderBoxArtSVG(box, { width = 160, height = 120 } = {}) {
  const { hue1, hue2 } = box.art || { hue1: '#3a4657', hue2: '#141a24' };
  const g = uid('bx');
  const brandShort = box.brand.length > 14 ? box.brand.slice(0, 13) + '…' : box.brand;
  return `<svg viewBox="0 0 160 120" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="f${g}" x1="0" y1="0" x2="0.9" y2="1">
        <stop offset="0%" stop-color="${hue1}" />
        <stop offset="100%" stop-color="${hue2}" />
      </linearGradient>
      <linearGradient id="s${g}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${hue2}" />
        <stop offset="100%" stop-color="#05070b" />
      </linearGradient>
      <linearGradient id="foil${g}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.05" />
        <stop offset="45%" stop-color="#fff" stop-opacity="0.65" />
        <stop offset="55%" stop-color="#fff" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0.05" />
      </linearGradient>
    </defs>
    <!-- side panel -->
    <path d="M 128 18 L 152 30 L 152 108 L 128 116 Z" fill="url(#s${g})" stroke="#00000066" stroke-width="1" />
    <path d="M 128 18 L 152 30 L 152 40 L 128 27 Z" fill="#ffffff14" />
    <!-- front panel -->
    <rect x="8" y="14" width="120" height="102" rx="4" fill="url(#f${g})" stroke="#00000066" stroke-width="1.2" />
    <!-- top lid lip -->
    <path d="M 8 14 L 128 14 L 152 30 L 30 30 Z" fill="${hue1}" opacity="0.9" stroke="#00000044" stroke-width="1" />
    <path d="M 8 14 L 128 14 L 152 30 L 30 30 Z" fill="#ffffff2a" />
    <!-- foil band -->
    <rect x="8" y="52" width="120" height="16" fill="url(#foil${g})" />
    <!-- brand wordmark -->
    <text x="68" y="42" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle" letter-spacing="1">${brandShort.toUpperCase()}</text>
    <!-- product name -->
    <text x="68" y="84" font-family="Arial, sans-serif" font-weight="700" font-size="9.5" fill="#ffffffd9" text-anchor="middle">${box.name.toUpperCase()}</text>
    <text x="68" y="97" font-family="Arial, sans-serif" font-weight="600" font-size="7.5" fill="#ffffff99" text-anchor="middle">${box.packCount} PACKS • ${box.cardsPerPack} CARDS PER PACK</text>
    <!-- holo sticker -->
    <circle cx="115" cy="103" r="7" fill="#ffffff" opacity="0.9" />
    <circle cx="115" cy="103" r="7" fill="url(#foil${g})" />
    <circle cx="115" cy="103" r="7" fill="none" stroke="${hue2}" stroke-width="1" />
    <!-- gridiron laces motif -->
    <g stroke="#ffffff66" stroke-width="1.4" stroke-linecap="round">
      <path d="M 20 100 L 34 100" /><path d="M 23 96 L 23 104" /><path d="M 27 96 L 27 104" /><path d="M 31 96 L 31 104" />
    </g>
  </svg>`;
}

export function boxArtEl(box, opts = {}) {
  const el = document.createElement('div');
  el.className = 'product-box-art';
  el.innerHTML = renderBoxArtSVG(box, opts);
  return el;
}

export function stylePackEl(packEl, box) {
  const { hue1, hue2 } = box.art || { hue1: '#2e6fb0', hue2: '#123a63' };
  packEl.style.background = `linear-gradient(155deg, ${hue1} 0%, ${hue2} 55%, #05070b 100%)`;
  packEl.classList.add('pack-foil');
  const brand = document.createElement('div');
  brand.className = 'pack-brand';
  brand.textContent = box.brand.toUpperCase();
  packEl.appendChild(brand);
}
