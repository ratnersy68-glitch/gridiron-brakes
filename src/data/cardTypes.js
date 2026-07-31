// Card "finishes" (parallels), numbered parallels, autograph/relic types,
// and insert set names. Everything here is original, football-flavored,
// but not tied to any real product line or trademark. Value multipliers are
// tuned against a Monte Carlo sim of box EV so ripping boxes stays -EV on
// average (like the real hobby) with value concentrated in scarce hits.

export const FINISHES = [
  { key: 'base', label: 'Base', rarity: 'common', valueMult: 1 },
  { key: 'silver', label: 'Silver', rarity: 'common', valueMult: 0.77 },
  { key: 'gold', label: 'Gold', rarity: 'uncommon', valueMult: 1.21 },
  { key: 'blue_wave', label: 'Blue Wave', rarity: 'uncommon', valueMult: 1.32 },
  { key: 'red_ice', label: 'Red Ice', rarity: 'uncommon', valueMult: 1.38 },
  { key: 'green_sparkle', label: 'Green Sparkle', rarity: 'rare', valueMult: 1.93 },
  { key: 'purple_burst', label: 'Purple Burst', rarity: 'rare', valueMult: 2.09 },
  { key: 'orange_lava', label: 'Orange Lava', rarity: 'rare', valueMult: 2.2 },
  { key: 'pink_pulse', label: 'Pink Pulse', rarity: 'rare', valueMult: 2.31 },
  { key: 'black_ice', label: 'Black Ice', rarity: 'epic', valueMult: 3.3 },
  { key: 'color_splash', label: 'Color Splash', rarity: 'epic', valueMult: 3.58 },
  { key: 'holographic', label: 'Holographic', rarity: 'epic', valueMult: 3.85 },
  { key: 'laser', label: 'Laser', rarity: 'epic', valueMult: 4.12 },
  { key: 'galaxy', label: 'Galaxy', rarity: 'legendary', valueMult: 6.05 },
  { key: 'fire', label: 'Fire', rarity: 'legendary', valueMult: 6.6 },
  { key: 'neon', label: 'Neon', rarity: 'legendary', valueMult: 6.88 },
  { key: 'diamond', label: 'Diamond', rarity: 'mythic', valueMult: 11 },
  { key: 'crystal', label: 'Crystal', rarity: 'mythic', valueMult: 12 },
  { key: 'prismatic', label: 'Prismatic', rarity: 'impossible', valueMult: 19 },
  { key: 'chrome', label: 'Chrome', rarity: 'impossible', valueMult: 20 },
  { key: 'mirror', label: 'Mirror', rarity: 'oneofone', valueMult: 44 },
];

export const NUMBERED_PARALLELS = [
  { key: 'n999', label: '/999', run: 999, rarity: 'uncommon', valueMult: 1.65 },
  { key: 'n499', label: '/499', run: 499, rarity: 'rare', valueMult: 2.75 },
  { key: 'n299', label: '/299', run: 299, rarity: 'rare', valueMult: 3.85 },
  { key: 'n199', label: '/199', run: 199, rarity: 'epic', valueMult: 5.5 },
  { key: 'n99', label: '/99', run: 99, rarity: 'epic', valueMult: 8.25 },
  { key: 'n75', label: '/75', run: 75, rarity: 'legendary', valueMult: 14 },
  { key: 'n50', label: '/50', run: 50, rarity: 'legendary', valueMult: 21 },
  { key: 'n25', label: '/25', run: 25, rarity: 'legendary', valueMult: 33 },
  { key: 'n10', label: '/10', run: 10, rarity: 'mythic', valueMult: 66 },
  { key: 'n5', label: '/5', run: 5, rarity: 'mythic', valueMult: 121 },
  { key: 'n2', label: '/2', run: 2, rarity: 'impossible', valueMult: 209 },
  { key: 'n1', label: '1/1', run: 1, rarity: 'oneofone', valueMult: 495 },
];

export const SIGNATURE_TYPES = [
  { key: 'auto', label: 'Autograph', rarity: 'legendary', valueMult: 28, needsPatch: false },
  { key: 'patch_auto', label: 'Patch Auto', rarity: 'legendary', valueMult: 36, needsPatch: true },
  { key: 'dual_patch', label: 'Dual Patch', rarity: 'mythic', valueMult: 82, needsPatch: true },
  { key: 'triple_patch', label: 'Triple Patch', rarity: 'mythic', valueMult: 110, needsPatch: true },
  { key: 'quad_patch', label: 'Quad Patch', rarity: 'impossible', valueMult: 176, needsPatch: true },
  { key: 'game_worn', label: 'Game Worn', rarity: 'epic', valueMult: 8.25, needsPatch: true },
  { key: 'rookie_auto', label: 'Rookie Auto', rarity: 'legendary', valueMult: 44, needsPatch: false },
  { key: 'legend_auto', label: 'Legend Auto', rarity: 'mythic', valueMult: 132, needsPatch: false },
  { key: 'hof_auto', label: 'Hall of Fame', rarity: 'mythic', valueMult: 148, needsPatch: false },
  { key: 'dual_auto', label: 'Dual Auto', rarity: 'mythic', valueMult: 121, needsPatch: false },
  { key: 'booklet', label: 'Booklet Card', rarity: 'impossible', valueMult: 209, needsPatch: true },
  { key: 'printing_plate', label: 'Printing Plate', rarity: 'oneofone', valueMult: 385, needsPatch: false },
  { key: 'sketch', label: 'Sketch Card', rarity: 'impossible', valueMult: 248, needsPatch: false },
];

// Ultra-rare insert sets — in this game each insert pull binds to a random
// eligible player.
export const INSERT_SETS = [
  { key: 'genesis_glow', label: 'Genesis Glow', rarity: 'epic', valueMult: 6.6 },
  { key: 'firebird_rising', label: 'Firebird Rising', rarity: 'legendary', valueMult: 15 },
  { key: 'legends_never_die', label: 'Legends Never Die', rarity: 'legendary', valueMult: 20 },
  { key: 'prismatic_storm', label: 'Prismatic Storm', rarity: 'mythic', valueMult: 55 },
  { key: 'gridiron_gods', label: 'Gridiron Gods', rarity: 'mythic', valueMult: 88 },
  { key: 'vault_exclusive', label: 'Vault Exclusive', rarity: 'impossible', valueMult: 165 },
  { key: 'dynasty_kings', label: 'Dynasty Kings', rarity: 'impossible', valueMult: 187 },
  { key: 'one_of_a_kind', label: 'One of a Kind', rarity: 'oneofone', valueMult: 330 },
];

export function allCardTypeOptions() {
  return {
    finishes: FINISHES,
    numbered: NUMBERED_PARALLELS,
    signature: SIGNATURE_TYPES,
    inserts: INSERT_SETS,
  };
}
