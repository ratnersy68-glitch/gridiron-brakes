// Card instance model: turns an abstract "pull" (rarity + category + player)
// into a concrete card object with a stable dedupe key, base value, and
// display metadata. This is the only place that knows how a card's value is
// first computed — later drift happens in economy.js.

import { PLAYERS, PLAYERS_BY_TIER, getPlayer } from '../data/players.js';
import { getTeam } from '../data/teams.js';
import { FINISHES, NUMBERED_PARALLELS, SIGNATURE_TYPES, INSERT_SETS } from '../data/cardTypes.js';
import { getRarity } from '../data/rarities.js';
import { pick, pickWeighted, randInt } from '../utils/rng.js';

const TIER_BASE_VALUE = { legend: 550, star: 130, starter: 38, rookie: 48, depth: 9 };

// Which player tiers are eligible per rarity slot, and how heavily weighted.
// Keeps commons full of scrubs/rookies and legendaries reserved for stars,
// which is what makes cracking a big box feel earned.
const RARITY_PLAYER_WEIGHTS = {
  common: { depth: 70, rookie: 20, starter: 10 },
  uncommon: { depth: 40, rookie: 25, starter: 30, star: 5 },
  rare: { depth: 15, rookie: 20, starter: 40, star: 20, legend: 5 },
  epic: { starter: 25, rookie: 20, star: 40, legend: 15 },
  legendary: { star: 45, legend: 55 },
  mythic: { star: 35, legend: 65 },
  impossible: { star: 25, legend: 75 },
  oneofone: { legend: 100 },
};

export const CATEGORY_POOLS = {
  finish: FINISHES,
  numbered: NUMBERED_PARALLELS,
  signature: SIGNATURE_TYPES,
  insert: INSERT_SETS,
};

export function poolsForRarity(rarityKey) {
  const out = [];
  for (const [category, list] of Object.entries(CATEGORY_POOLS)) {
    for (const def of list) {
      if (def.rarity === rarityKey) out.push({ category, def });
    }
  }
  return out;
}

export function pickPlayerForRarity(rng, rarityKey) {
  const weights = RARITY_PLAYER_WEIGHTS[rarityKey] || RARITY_PLAYER_WEIGHTS.common;
  const entries = Object.entries(weights)
    .filter(([tier]) => PLAYERS_BY_TIER[tier]?.length)
    .map(([tier, weight]) => ({ value: tier, weight }));
  if (!entries.length) return pick(rng, PLAYERS);
  const tier = pickWeighted(rng, entries);
  return pick(rng, PLAYERS_BY_TIER[tier]);
}

function serialFlavorMult(serial) {
  if (serial === 1) return 1.6;
  if (serial <= 5) return 1.25;
  return 1;
}

// Deliberately excludes serial number: owning any copy of a numbered
// parallel completes that checklist slot, same as owning any autograph
// completes the auto slot. Serial still lives on the card instance for
// flavor/value, it just isn't part of what "completes the binder" means.
export function dedupeKey({ playerId, category, typeKey }) {
  return `${playerId}::${category}::${typeKey}`;
}

export function makeCard({ rng, rarityKey, category, typeDef, player, boxKey, source, gameDay }) {
  const rarity = getRarity(rarityKey);
  const team = getTeam(player.teamId);
  const isNumbered = category === 'numbered';
  const serial = isNumbered ? randInt(rng, 1, typeDef.run) : null;

  const base = TIER_BASE_VALUE[player.tier] ?? 20;
  let value = base * (typeDef.valueMult ?? 1);
  if (isNumbered) value *= serialFlavorMult(serial);
  if (player.isRookie) value *= 1.15;
  value = Math.max(1, Math.round(value));

  const key = dedupeKey({ playerId: player.id, category, typeKey: typeDef.key });

  return {
    uid: `${key}::${Math.random().toString(36).slice(2, 8)}`,
    key,
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    overall: player.overall,
    teamId: team.id,
    teamName: team.name,
    rookieYear: player.rookieYear,
    isRookie: player.isRookie,
    category, // finish | numbered | signature | insert
    typeKey: typeDef.key,
    typeLabel: typeDef.label,
    serial,
    printRun: typeDef.run ?? null,
    rarityKey,
    rarityLabel: rarity.label,
    rarityColor: rarity.color,
    baseValue: value,
    marketValue: value,
    boxKey,
    source: source || 'pack',
    pulledOnDay: gameDay ?? 0,
    favorite: false,
    locked: false,
    createdAt: Date.now(),
  };
}
