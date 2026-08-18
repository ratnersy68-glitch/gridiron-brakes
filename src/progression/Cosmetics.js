// Cosmetic catalog. Everything here is earned with in-game currency only —
// there is no real-money purchase path anywhere in the game.

export const COSMETICS = {
  shapes: [
    { id: 'classic', name: 'Classic Square', cost: 0 },
    { id: 'diamond', name: 'Diamond', cost: 150 },
    { id: 'hex', name: 'Hexagon', cost: 200 },
    { id: 'star', name: 'Star Cutter', cost: 300 },
    { id: 'triforce', name: 'Tri-Blade', cost: 350 },
    { id: 'ring', name: 'Halo Ring', cost: 450 },
    { id: 'bolt', name: 'Bolt Fragment', cost: 600 },
    { id: 'crystal', name: 'Prism Crystal', cost: 800 },
  ],
  trails: [
    { id: 'none', name: 'No Trail', cost: 0 },
    { id: 'spark', name: 'Spark Trail', cost: 120 },
    { id: 'ribbon', name: 'Ribbon Trail', cost: 220 },
    { id: 'pixel', name: 'Pixel Dust', cost: 260 },
    { id: 'comet', name: 'Comet Tail', cost: 400 },
    { id: 'double', name: 'Double Helix', cost: 550 },
  ],
  colors: [
    { id: 'neon-cyan', name: 'Neon Cyan', cost: 0, hex: '#37f0ff' },
    { id: 'ember', name: 'Ember Orange', cost: 100, hex: '#ff7a37' },
    { id: 'violet', name: 'Violet Surge', cost: 100, hex: '#b03bff' },
    { id: 'acid', name: 'Acid Green', cost: 150, hex: '#a4ff37' },
    { id: 'rose', name: 'Rose Static', cost: 150, hex: '#ff37a4' },
    { id: 'gold', name: 'Solar Gold', cost: 350, hex: '#ffd23b' },
    { id: 'chrome', name: 'Chrome White', cost: 500, hex: '#f2f6ff' },
  ],
  deathEffects: [
    { id: 'spark', name: 'Spark Burst', cost: 0 },
    { id: 'shatter', name: 'Shatter', cost: 180 },
    { id: 'implode', name: 'Implode', cost: 260 },
    { id: 'confetti', name: 'Confetti Pop', cost: 320 },
    { id: 'voidburst', name: 'Void Burst', cost: 500 },
  ],
  icons: [
    { id: 'default', name: 'Default Mark', cost: 0 },
    { id: 'skull', name: 'Skull Mark', cost: 200 },
    { id: 'wing', name: 'Wing Mark', cost: 250 },
    { id: 'eye', name: 'Watcher Mark', cost: 400 },
  ],
  bgEffects: [
    { id: 'none', name: 'Plain', cost: 0 },
    { id: 'grid', name: 'Scanning Grid', cost: 150 },
    { id: 'rain', name: 'Data Rain', cost: 220 },
    { id: 'nebula', name: 'Nebula Drift', cost: 400 },
  ],
};

const CATEGORY_TO_SAVE_KEY = {
  shapes: 'unlockedShapes', trails: 'unlockedTrails', colors: 'unlockedColors',
  deathEffects: 'unlockedDeathEffects', icons: 'unlockedIcons', bgEffects: 'unlockedBgEffects',
};
const CATEGORY_TO_EQUIP_KEY = {
  shapes: 'shape', trails: 'trail', colors: 'color', deathEffects: 'deathEffect', icons: 'icon', bgEffects: 'bgEffect',
};

export function purchaseCosmetic(save, category, id) {
  const item = COSMETICS[category]?.find((c) => c.id === id);
  if (!item) return { ok: false, reason: 'not-found' };
  const key = CATEGORY_TO_SAVE_KEY[category];
  if (save.data[key].includes(id)) return { ok: false, reason: 'owned' };
  if (save.data.currency < item.cost) return { ok: false, reason: 'insufficient-funds' };
  save.data.currency -= item.cost;
  save.data[key].push(id);
  save.save();
  return { ok: true };
}

export function equipCosmetic(save, category, id) {
  const key = CATEGORY_TO_SAVE_KEY[category];
  if (!save.data[key].includes(id)) return { ok: false, reason: 'not-owned' };
  save.data.equipped[CATEGORY_TO_EQUIP_KEY[category]] = id;
  save.save();
  return { ok: true };
}

export function getColorHex(save, colorId) {
  return COSMETICS.colors.find((c) => c.id === colorId)?.hex || '#37f0ff';
}
