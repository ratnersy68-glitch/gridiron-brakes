// Visual identity templates. Every set/brand and several flashy inserts and
// finishes get a completely distinct card-front look (background pattern,
// border treatment, foil behavior), resolved in priority order: insert >
// finish > box brand > generic rarity fallback. Purely CSS class names —
// the actual rendering lives in styles/cardArt.css.

export const INSERT_TEMPLATES = {
  firebird_rising: { key: 'firebird', label: 'Firebird', border: 'tmpl-border-flame', bg: 'tmpl-bg-flame', foil: 'tmpl-foil-warm' },
  prismatic_storm: { key: 'stormFront', label: 'Storm Front', border: 'tmpl-border-chrome', bg: 'tmpl-bg-storm', foil: 'tmpl-foil-rainbow' },
  gridiron_gods: { key: 'godsLight', label: "Gridiron Gods", border: 'tmpl-border-gold', bg: 'tmpl-bg-raylight', foil: 'tmpl-foil-gold' },
  vault_exclusive: { key: 'vaultDoor', label: 'Vault Exclusive', border: 'tmpl-border-vault', bg: 'tmpl-bg-vault', foil: 'tmpl-foil-gold' },
  dynasty_kings: { key: 'dynastyCrest', label: 'Dynasty Kings', border: 'tmpl-border-royal', bg: 'tmpl-bg-royal', foil: 'tmpl-foil-gold' },
  one_of_a_kind: { key: 'cosmic', label: 'One of a Kind', border: 'tmpl-border-cosmic', bg: 'tmpl-bg-cosmic', foil: 'tmpl-foil-rainbow' },
  genesis_glow: { key: 'genesisGlow', label: 'Genesis Glow', border: 'tmpl-border-marble', bg: 'tmpl-bg-marble', foil: 'tmpl-foil-gold' },
  legends_never_die: { key: 'legendsMarble', label: 'Legends Never Die', border: 'tmpl-border-marble', bg: 'tmpl-bg-marble-purple', foil: 'tmpl-foil-gold' },
};

export const FINISH_TEMPLATES = {
  chrome: { key: 'optix', label: 'Optix', border: 'tmpl-border-chrome', bg: 'tmpl-bg-optix', foil: 'tmpl-foil-chrome' },
  mirror: { key: 'optixMirror', label: 'Optix Mirror', border: 'tmpl-border-chrome', bg: 'tmpl-bg-optix', foil: 'tmpl-foil-mirror' },
  prismatic: { key: 'prismo', label: 'Prismo', border: 'tmpl-border-thick', bg: 'tmpl-bg-prismo', foil: 'tmpl-foil-rainbow' },
  holographic: { key: 'holo', label: 'Holographic', border: 'tmpl-border-thin', bg: 'tmpl-bg-holo', foil: 'tmpl-foil-rainbow' },
  laser: { key: 'laser', label: 'Laser', border: 'tmpl-border-thin', bg: 'tmpl-bg-laser', foil: 'tmpl-foil-rainbow' },
  galaxy: { key: 'galaxy', label: 'Galaxy', border: 'tmpl-border-cosmic', bg: 'tmpl-bg-cosmic', foil: 'tmpl-foil-rainbow' },
  fire: { key: 'fire', label: 'Fire', border: 'tmpl-border-flame', bg: 'tmpl-bg-flame', foil: 'tmpl-foil-warm' },
  neon: { key: 'neon', label: 'Neon', border: 'tmpl-border-neon', bg: 'tmpl-bg-neon', foil: 'tmpl-foil-cool' },
  diamond: { key: 'diamond', label: 'Diamond', border: 'tmpl-border-chrome', bg: 'tmpl-bg-shard', foil: 'tmpl-foil-chrome' },
  crystal: { key: 'crystal', label: 'Crystal', border: 'tmpl-border-thin', bg: 'tmpl-bg-shard', foil: 'tmpl-foil-cool' },
  black_ice: { key: 'blackIce', label: 'Black Ice', border: 'tmpl-border-ice', bg: 'tmpl-bg-blackice', foil: 'tmpl-foil-cool' },
  color_splash: { key: 'splash', label: 'Color Splash', border: 'tmpl-border-thin', bg: 'tmpl-bg-splash', foil: 'tmpl-foil-warm' },
};

export const BOX_TEMPLATES = {
  starter: { key: 'panin', label: 'Panin', border: 'tmpl-border-thin', bg: 'tmpl-bg-clean', foil: 'tmpl-foil-none' },
  value: { key: 'toppz', label: 'Toppz', border: 'tmpl-border-thin', bg: 'tmpl-bg-clean', foil: 'tmpl-foil-none' },
  blaster: { key: 'donrus', label: 'Donrus', border: 'tmpl-border-thin', bg: 'tmpl-bg-dots', foil: 'tmpl-foil-cool' },
  retail: { key: 'chosen', label: 'Chosen', border: 'tmpl-border-thin', bg: 'tmpl-bg-clean', foil: 'tmpl-foil-cool' },
  mega: { key: 'mosaico', label: 'Mosaico', border: 'tmpl-border-thick', bg: 'tmpl-bg-shard', foil: 'tmpl-foil-warm' },
  collector: { key: 'prismoCollector', label: 'Prismo', border: 'tmpl-border-thick', bg: 'tmpl-bg-prismo', foil: 'tmpl-foil-rainbow' },
  premium: { key: 'absoluteEdge', label: 'Absolute Edge', border: 'tmpl-border-diag', bg: 'tmpl-bg-diag', foil: 'tmpl-foil-cool' },
  hobby: { key: 'challengers', label: 'Challengers', border: 'tmpl-border-thin', bg: 'tmpl-bg-stadium', foil: 'tmpl-foil-warm' },
  elite_hobby: { key: 'elitePrestige', label: 'Elite Prestige', border: 'tmpl-border-chrome', bg: 'tmpl-bg-stadium', foil: 'tmpl-foil-chrome' },
  prismo_hobby: { key: 'prismoHobby', label: 'Prismo', border: 'tmpl-border-thick', bg: 'tmpl-bg-prismo', foil: 'tmpl-foil-rainbow' },
  genesis_hobby: { key: 'genesis', label: 'Genesis', border: 'tmpl-border-marble', bg: 'tmpl-bg-marble', foil: 'tmpl-foil-gold' },
  national_vault: { key: 'nationalVault', label: 'National Vault', border: 'tmpl-border-vault', bg: 'tmpl-bg-vault', foil: 'tmpl-foil-gold' },
  legend_collection: { key: 'legends', label: 'Legends', border: 'tmpl-border-marble', bg: 'tmpl-bg-marble-purple', foil: 'tmpl-foil-gold' },
  hof_collection: { key: 'hallOfFame', label: 'Hall of Fame', border: 'tmpl-border-bronze', bg: 'tmpl-bg-bronze', foil: 'tmpl-foil-gold' },
  championship_collection: { key: 'championship', label: 'Championship', border: 'tmpl-border-gold', bg: 'tmpl-bg-confetti', foil: 'tmpl-foil-gold' },
  dynasty_collection: { key: 'dynasty', label: 'Dynasty', border: 'tmpl-border-royal', bg: 'tmpl-bg-royal', foil: 'tmpl-foil-gold' },
  ultimate_chest: { key: 'ultimate', label: 'Ultimate', border: 'tmpl-border-cosmic', bg: 'tmpl-bg-cosmic', foil: 'tmpl-foil-rainbow' },
};

const FALLBACK = { key: 'standard', label: 'Standard', border: 'tmpl-border-thin', bg: 'tmpl-bg-clean', foil: 'tmpl-foil-none' };

export function resolveCardTemplate(card) {
  if (card.category === 'insert' && INSERT_TEMPLATES[card.typeKey]) return INSERT_TEMPLATES[card.typeKey];
  if (card.category === 'finish' && FINISH_TEMPLATES[card.typeKey]) return FINISH_TEMPLATES[card.typeKey];
  if (card.boxKey && BOX_TEMPLATES[card.boxKey]) return BOX_TEMPLATES[card.boxKey];
  return FALLBACK;
}
