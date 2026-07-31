// Card instance model: turns an abstract "pull" (rarity + category + player)
// into a concrete card object with a stable dedupe key, base value, and
// display metadata. This is the only place that knows how a card's value is
// first computed — later drift happens in economy.js.

import { PLAYERS, PLAYERS_BY_TIER, getPlayer } from '../data/players.js';
import { getTeam } from '../data/teams.js';
import { FINISHES, NUMBERED_PARALLELS, SIGNATURE_TYPES, INSERT_SETS } from '../data/cardTypes.js';
import { getRarity } from '../data/rarities.js';
import { pick, pickWeighted, randInt } from '../utils/rng.js';

// Deliberately harsh, mirroring the real hobby: commons are bulk worth
// pennies; nearly all of a box's value concentrates in its few hits.
const TIER_BASE_VALUE = { legend: 30, star: 8, starter: 1.2, rookie: 1.8, depth: 0.4 };

// Which player tiers are eligible per rarity slot, and how heavily weighted.
// Mirrors the real hobby: even autograph checklists are mostly role players
// and rookies — star and legend hits exist at every tier but stay scarce,
// which is exactly what makes them the chase.
const RARITY_PLAYER_WEIGHTS = {
  common: { depth: 75, rookie: 15, starter: 10 },
  uncommon: { depth: 55, rookie: 20, starter: 22, star: 3 },
  rare: { depth: 35, rookie: 25, starter: 32, star: 7, legend: 1 },
  epic: { depth: 25, rookie: 25, starter: 35, star: 12, legend: 3 },
  legendary: { depth: 18, rookie: 25, starter: 35, star: 17, legend: 5 },
  mythic: { rookie: 22, starter: 35, star: 30, legend: 13 },
  impossible: { rookie: 15, starter: 25, star: 38, legend: 22 },
  oneofone: { starter: 15, rookie: 15, star: 40, legend: 30 },
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

  const base = TIER_BASE_VALUE[player.tier] ?? 1;
  let value = base * (typeDef.valueMult ?? 1);
  if (isNumbered) value *= serialFlavorMult(serial);
  if (player.isRookie) value *= 1.15;
  value = Math.max(0.25, Math.round(value * 100) / 100);

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
