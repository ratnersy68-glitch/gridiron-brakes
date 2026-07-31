// Card "finishes" (parallels), numbered parallels, autograph/relic types,
// and insert set names. Everything here is original, football-flavored,
// but not tied to any real product line or trademark.

export const FINISHES = [
  { key: 'base', label: 'Base', rarity: 'common', valueMult: 1 },
  { key: 'silver', label: 'Silver', rarity: 'common', valueMult: 1.3 },
  { key: 'gold', label: 'Gold', rarity: 'uncommon', valueMult: 1.8 },
  { key: 'blue_wave', label: 'Blue Wave', rarity: 'uncommon', valueMult: 2 },
  { key: 'red_ice', label: 'Red Ice', rarity: 'uncommon', valueMult: 2.1 },
  { key: 'green_sparkle', label: 'Green Sparkle', rarity: 'rare', valueMult: 3 },
  { key: 'purple_burst', label: 'Purple Burst', rarity: 'rare', valueMult: 3.2 },
  { key: 'orange_lava', label: 'Orange Lava', rarity: 'rare', valueMult: 3.4 },
  { key: 'pink_pulse', label: 'Pink Pulse', rarity: 'rare', valueMult: 3.6 },
  { key: 'black_ice', label: 'Black Ice', rarity: 'epic', valueMult: 5 },
  { key: 'color_splash', label: 'Color Splash', rarity: 'epic', valueMult: 5.5 },
  { key: 'holographic', label: 'Holographic', rarity: 'epic', valueMult: 6 },
  { key: 'laser', label: 'Laser', rarity: 'epic', valueMult: 6.2 },
  { key: 'galaxy', label: 'Galaxy', rarity: 'legendary', valueMult: 9 },
  { key: 'fire', label: 'Fire', rarity: 'legendary', valueMult: 9.5 },
  { key: 'neon', label: 'Neon', rarity: 'legendary', valueMult: 10 },
  { key: 'diamond', label: 'Diamond', rarity: 'mythic', valueMult: 16 },
  { key: 'crystal', label: 'Crystal', rarity: 'mythic', valueMult: 17 },
  { key: 'prismatic', label: 'Prismatic', rarity: 'impossible', valueMult: 26 },
  { key: 'chrome', label: 'Chrome', rarity: 'impossible', valueMult: 27 },
  { key: 'mirror', label: 'Mirror', rarity: 'oneofone', valueMult: 60 },
];

export const NUMBERED_PARALLELS = [
  { key: 'n999', label: '/999', run: 999, rarity: 'uncommon', valueMult: 2.5 },
  { key: 'n499', label: '/499', run: 499, rarity: 'rare', valueMult: 4 },
  { key: 'n299', label: '/299', run: 299, rarity: 'rare', valueMult: 5.5 },
  { key: 'n199', label: '/199', run: 199, rarity: 'epic', valueMult: 8 },
  { key: 'n99', label: '/99', run: 99, rarity: 'epic', valueMult: 12 },
  { key: 'n75', label: '/75', run: 75, rarity: 'legendary', valueMult: 20 },
  { key: 'n50', label: '/50', run: 50, rarity: 'legendary', valueMult: 30 },
  { key: 'n25', label: '/25', run: 25, rarity: 'legendary', valueMult: 45 },
  { key: 'n10', label: '/10', run: 10, rarity: 'mythic', valueMult: 90 },
  { key: 'n5', label: '/5', run: 5, rarity: 'mythic', valueMult: 160 },
  { key: 'n2', label: '/2', run: 2, rarity: 'impossible', valueMult: 500 },
  { key: 'n1', label: '1/1', run: 1, rarity: 'oneofone', valueMult: 1500 },
];

export const SIGNATURE_TYPES = [
  { key: 'auto', label: 'Autograph', rarity: 'legendary', valueMult: 55, needsPatch: false },
  { key: 'patch_auto', label: 'Patch Auto', rarity: 'legendary', valueMult: 70, needsPatch: true },
  { key: 'dual_patch', label: 'Dual Patch', rarity: 'mythic', valueMult: 150, needsPatch: true },
  { key: 'triple_patch', label: 'Triple Patch', rarity: 'mythic', valueMult: 220, needsPatch: true },
  { key: 'quad_patch', label: 'Quad Patch', rarity: 'impossible', valueMult: 380, needsPatch: true },
  { key: 'game_worn', label: 'Game Worn', rarity: 'epic', valueMult: 18, needsPatch: true },
  { key: 'rookie_auto', label: 'Rookie Auto', rarity: 'legendary', valueMult: 90, needsPatch: false },
  { key: 'legend_auto', label: 'Legend Auto', rarity: 'mythic', valueMult: 260, needsPatch: false },
  { key: 'hof_auto', label: 'Hall of Fame', rarity: 'mythic', valueMult: 300, needsPatch: false },
  { key: 'dual_auto', label: 'Dual Auto', rarity: 'mythic', valueMult: 240, needsPatch: false },
  { key: 'booklet', label: 'Booklet Card', rarity: 'impossible', valueMult: 450, needsPatch: true },
  { key: 'printing_plate', label: 'Printing Plate', rarity: 'oneofone', valueMult: 900, needsPatch: false },
  { key: 'sketch', label: 'Sketch Card', rarity: 'impossible', valueMult: 500, needsPatch: false },
];

// Ultra-rare insert sets — not tied to a specific player necessarily, but in
// this game we bind each insert pull to a random eligible player.
export const INSERT_SETS = [
  { key: 'genesis_glow', label: 'Genesis Glow', rarity: 'epic', valueMult: 10 },
  { key: 'firebird_rising', label: 'Firebird Rising', rarity: 'legendary', valueMult: 24 },
  { key: 'legends_never_die', label: 'Legends Never Die', rarity: 'legendary', valueMult: 32 },
  { key: 'prismatic_storm', label: 'Prismatic Storm', rarity: 'mythic', valueMult: 80 },
  { key: 'gridiron_gods', label: 'Gridiron Gods', rarity: 'mythic', valueMult: 130 },
  { key: 'vault_exclusive', label: 'Vault Exclusive', rarity: 'impossible', valueMult: 340 },
  { key: 'dynasty_kings', label: 'Dynasty Kings', rarity: 'impossible', valueMult: 400 },
  { key: 'one_of_a_kind', label: 'One of a Kind', rarity: 'oneofone', valueMult: 1000 },
];

export function allCardTypeOptions() {
  return {
    finishes: FINISHES,
    numbered: NUMBERED_PARALLELS,
    signature: SIGNATURE_TYPES,
    inserts: INSERT_SETS,
  };
}
