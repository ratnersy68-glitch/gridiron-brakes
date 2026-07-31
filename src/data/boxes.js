// The 17 box products the player can buy. Brand names are original riffs on
// real hobby vocabulary (never a real product/company name). Each box has
// its own price, pack structure, rarity-odds modifier, and guaranteed hit
// slots — better boxes cost more but pull meaningfully better.

export const BOXES = [
  {
    key: 'starter', name: 'Starter Box', brand: 'Panin', price: 25,
    packCount: 4, cardsPerPack: 6,
    oddsMult: { common: 1, uncommon: 0.9, rare: 0.6, epic: 0.3, legendary: 0.15, mythic: 0.05, impossible: 0.02, oneofone: 0.005 },
    guarantees: [],
    blurb: 'The classic entry point. Light on odds, big on nostalgia.',
  },
  {
    key: 'value', name: 'Value Box', brand: 'Toppz', price: 40,
    packCount: 6, cardsPerPack: 6,
    oddsMult: { common: 1, uncommon: 1, rare: 0.7, epic: 0.35, legendary: 0.18, mythic: 0.06, impossible: 0.025, oneofone: 0.006 },
    guarantees: [],
    blurb: 'A few more packs, a few more shots at something shiny.',
  },
  {
    key: 'blaster', name: 'Blaster Box', brand: 'Donrus', price: 60,
    packCount: 7, cardsPerPack: 7,
    oddsMult: { common: 0.95, uncommon: 1, rare: 0.85, epic: 0.45, legendary: 0.22, mythic: 0.08, impossible: 0.03, oneofone: 0.008 },
    guarantees: [{ type: 'numbered', count: 1 }],
    blurb: 'Guaranteed numbered parallel in every box.',
  },
  {
    key: 'retail', name: 'Retail Box', brand: 'Chosen', price: 70,
    packCount: 8, cardsPerPack: 7,
    oddsMult: { common: 0.9, uncommon: 1, rare: 0.95, epic: 0.5, legendary: 0.26, mythic: 0.09, impossible: 0.035, oneofone: 0.009 },
    guarantees: [{ type: 'numbered', count: 1 }],
    blurb: 'Shelf-friendly, but with real hit potential.',
  },
  {
    key: 'mega', name: 'Mega Box', brand: 'Mosaico', price: 90,
    packCount: 9, cardsPerPack: 8,
    oddsMult: { common: 0.85, uncommon: 1, rare: 1.05, epic: 0.6, legendary: 0.32, mythic: 0.12, impossible: 0.045, oneofone: 0.011 },
    guarantees: [{ type: 'numbered', count: 1 }, { type: 'insert', count: 1 }],
    blurb: 'Extra packs and an insert slot every time.',
  },
  {
    key: 'collector', name: 'Collector Box', brand: 'Prismo', price: 150,
    packCount: 10, cardsPerPack: 8,
    oddsMult: { common: 0.75, uncommon: 1, rare: 1.3, epic: 0.85, legendary: 0.5, mythic: 0.2, impossible: 0.08, oneofone: 0.02 },
    guarantees: [{ type: 'numbered', count: 2 }, { type: 'insert', count: 1 }],
    blurb: 'Built for collectors chasing full parallel runs.',
  },
  {
    key: 'premium', name: 'Premium Box', brand: 'Absolute Edge', price: 250,
    packCount: 10, cardsPerPack: 9,
    oddsMult: { common: 0.6, uncommon: 1, rare: 1.6, epic: 1.2, legendary: 0.75, mythic: 0.32, impossible: 0.13, oneofone: 0.032 },
    guarantees: [{ type: 'numbered', count: 2 }, { type: 'signature', count: 1 }],
    blurb: 'A guaranteed signature slot — the first real business investment.',
  },
  {
    key: 'hobby', name: 'Hobby Box', brand: 'Challengers', price: 350,
    packCount: 12, cardsPerPack: 9,
    oddsMult: { common: 0.5, uncommon: 0.95, rare: 1.8, epic: 1.5, legendary: 1, mythic: 0.45, impossible: 0.18, oneofone: 0.045 },
    guarantees: [{ type: 'numbered', count: 2 }, { type: 'signature', count: 1 }, { type: 'insert', count: 1 }],
    blurb: 'The gold standard hobby product for serious collectors.',
  },
  {
    key: 'elite_hobby', name: 'Elite Hobby', brand: 'Elite Prestige', price: 500,
    packCount: 12, cardsPerPack: 10,
    oddsMult: { common: 0.4, uncommon: 0.9, rare: 2, epic: 1.8, legendary: 1.3, mythic: 0.6, impossible: 0.26, oneofone: 0.065 },
    guarantees: [{ type: 'numbered', count: 3 }, { type: 'signature', count: 1 }, { type: 'insert', count: 1 }],
    blurb: 'Elevated odds across the board.',
  },
  {
    key: 'prismo_hobby', name: 'Prismo Hobby', brand: 'Prismo', price: 650,
    packCount: 14, cardsPerPack: 10,
    oddsMult: { common: 0.35, uncommon: 0.85, rare: 2.1, epic: 2, legendary: 1.5, mythic: 0.75, impossible: 0.33, oneofone: 0.085 },
    guarantees: [{ type: 'numbered', count: 3 }, { type: 'signature', count: 2 }],
    blurb: 'Two guaranteed signatures. Chrome and mirror parallels included.',
  },
  {
    key: 'genesis_hobby', name: 'Genesis Hobby', brand: 'Genesis', price: 750,
    packCount: 14, cardsPerPack: 11,
    oddsMult: { common: 0.3, uncommon: 0.8, rare: 2.2, epic: 2.1, legendary: 1.7, mythic: 0.9, impossible: 0.4, oneofone: 0.1 },
    guarantees: [{ type: 'numbered', count: 3 }, { type: 'signature', count: 2 }, { type: 'insert', count: 1 }],
    blurb: 'Where legit high-end collecting begins.',
  },
  {
    key: 'national_vault', name: 'National Vault', brand: 'National Vault', price: 1200,
    packCount: 16, cardsPerPack: 11,
    oddsMult: { common: 0.2, uncommon: 0.6, rare: 2.4, epic: 2.5, legendary: 2.2, mythic: 1.3, impossible: 0.6, oneofone: 0.16 },
    guarantees: [{ type: 'numbered', count: 4 }, { type: 'signature', count: 3 }, { type: 'insert', count: 1 }],
    blurb: 'Every card numbered or better. A true hit box.',
  },
  {
    key: 'legend_collection', name: 'Legend Collection', brand: 'Legends', price: 1800,
    packCount: 16, cardsPerPack: 12,
    oddsMult: { common: 0.12, uncommon: 0.45, rare: 2.5, epic: 2.8, legendary: 2.6, mythic: 1.7, impossible: 0.8, oneofone: 0.22 },
    guarantees: [{ type: 'numbered', count: 4 }, { type: 'signature', count: 3 }, { type: 'insert', count: 2 }],
    blurb: 'Stacked with legend-tier autographs.',
  },
  {
    key: 'hof_collection', name: 'Hall of Fame Collection', brand: 'Hall of Fame', price: 2500,
    packCount: 18, cardsPerPack: 12,
    oddsMult: { common: 0.08, uncommon: 0.3, rare: 2.4, epic: 3, legendary: 3, mythic: 2.2, impossible: 1.1, oneofone: 0.32 },
    guarantees: [{ type: 'numbered', count: 5 }, { type: 'signature', count: 4 }, { type: 'insert', count: 2 }],
    blurb: 'Enshrined greats. A true showcase box.',
  },
  {
    key: 'championship_collection', name: 'Championship Collection', brand: 'Championship', price: 4000,
    packCount: 20, cardsPerPack: 13,
    oddsMult: { common: 0.05, uncommon: 0.2, rare: 2.2, epic: 3.2, legendary: 3.4, mythic: 2.8, impossible: 1.5, oneofone: 0.45 },
    guarantees: [{ type: 'numbered', count: 6 }, { type: 'signature', count: 5 }, { type: 'insert', count: 3 }],
    blurb: 'Championship-tier hits, top to bottom.',
  },
  {
    key: 'dynasty_collection', name: 'Dynasty Collection', brand: 'Dynasty', price: 7500,
    packCount: 20, cardsPerPack: 14,
    oddsMult: { common: 0.03, uncommon: 0.12, rare: 1.8, epic: 3, legendary: 3.6, mythic: 3.4, impossible: 2, oneofone: 0.65 },
    guarantees: [{ type: 'numbered', count: 8 }, { type: 'signature', count: 6 }, { type: 'insert', count: 4 }],
    blurb: 'Build a dynasty binder in a single box.',
  },
  {
    key: 'ultimate_chest', name: 'Ultimate Collector Chest', brand: 'Ultimate', price: 15000,
    packCount: 24, cardsPerPack: 15,
    oddsMult: { common: 0.01, uncommon: 0.05, rare: 1.2, epic: 2.6, legendary: 3.8, mythic: 4.2, impossible: 3, oneofone: 1.2 },
    guarantees: [{ type: 'numbered', count: 10 }, { type: 'signature', count: 8 }, { type: 'insert', count: 6 }, { type: 'oneofone', count: 1 }],
    blurb: 'The whale box. A guaranteed one-of-one, every single time.',
  },
];

export function getBox(key) {
  return BOXES.find(b => b.key === key);
}
