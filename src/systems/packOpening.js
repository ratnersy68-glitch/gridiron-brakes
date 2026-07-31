// Resolves a box purchase into packs of cards, honoring each box's rarity
// odds modifier and guaranteed-hit slots. Pure function of (box, rng) so it
// is easy to unit-test or replay.

import { RARITIES } from '../data/rarities.js';
import { poolsForRarity, pickPlayerForRarity, makeCard } from './cards.js';
import { pick, pickWeighted, randInt } from '../utils/rng.js';

function rollRarity(rng, box, restrictToCategory) {
  const entries = RARITIES
    .filter(r => !restrictToCategory || poolsForRarity(r.key).some(p => p.category === restrictToCategory))
    .map(r => ({ value: r.key, weight: r.weight * (box.oddsMult[r.key] ?? 1) }));
  return pickWeighted(rng, entries);
}

function rollCard(rng, box, gameDay, forcedCategory) {
  const rarityKey = rollRarity(rng, box, forcedCategory);
  let candidates = poolsForRarity(rarityKey);
  if (forcedCategory) {
    const filtered = candidates.filter(c => c.category === forcedCategory);
    if (filtered.length) candidates = filtered;
  }
  const { category, def } = pick(rng, candidates.length ? candidates : poolsForRarity('common'));
  const player = pickPlayerForRarity(rng, rarityKey);
  return makeCard({ rng, rarityKey, category, typeDef: def, player, boxKey: box.key, gameDay });
}

/**
 * @returns {Array<Array<Card>>} packs, each an array of cards
 */
export function openBox(box, gameDay = 0) {
  const rng = Math.random;
  const totalSlots = box.packCount * box.cardsPerPack;
  const slots = new Array(totalSlots).fill(null).map(() => rollCard(rng, box, gameDay, null));

  // Apply guarantees by overwriting a set of slot indices with forced-category rolls.
  const takenIdx = new Set();
  for (const g of (box.guarantees || [])) {
    for (let i = 0; i < g.count; i++) {
      let idx;
      let guard = 0;
      do { idx = randInt(rng, 0, totalSlots - 1); guard++; } while (takenIdx.has(idx) && guard < 200);
      takenIdx.add(idx);
      const rarityForced = g.type === 'oneofone' ? 'oneofone' : null;
      if (rarityForced) {
        const candidates = poolsForRarity(rarityForced);
        const { category, def } = pick(rng, candidates);
        const player = pickPlayerForRarity(rng, rarityForced);
        slots[idx] = makeCard({ rng, rarityKey: rarityForced, category, typeDef: def, player, boxKey: box.key, gameDay });
      } else {
        slots[idx] = rollCard(rng, box, gameDay, g.type);
      }
    }
  }

  const packs = [];
  for (let p = 0; p < box.packCount; p++) {
    packs.push(slots.slice(p * box.cardsPerPack, (p + 1) * box.cardsPerPack));
  }
  return packs;
}
