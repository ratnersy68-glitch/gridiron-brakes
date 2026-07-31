// The full Gridiron Breaks player universe: curated signature stars plus a
// large procedurally-rounded-out roster, all wholly fictional. Deterministic
// seed keeps the universe stable across reloads/saves.

import { TEAMS } from './teams.js';
import { FIRST_NAMES, LAST_NAMES, POSITIONS } from './names.js';
import { mulberry32, pick, pickWeighted, randInt } from '../utils/rng.js';

const WORLD_SEED = 194831;

// Curated signature stars — these are the "chase" names of the game, each
// hand-placed at a high overall so they anchor the checklist and market.
const SIGNATURE_STARS = [
  // Quarterbacks
  ['Patty Myhome', 'QB', 99], ['Josh Allin', 'QB', 97], ['Lamar Jackman', 'QB', 96],
  ['Joey Burrows', 'QB', 95], ['Justin Harbor', 'QB', 94], ['Jaylen Hart', 'QB', 93],
  ['C.J. Strong', 'QB', 92], ['Trevor Laurence', 'QB', 91], ['Brock Pure', 'QB', 90],
  ['Dax Prescott', 'QB', 90], ['Tua Tagalo', 'QB', 89], ['Jordan Lovell', 'QB', 88],
  ['Aaron Rodger', 'QB', 92], ['Matt Stafforde', 'QB', 87], ['Kyler Murry', 'QB', 86],
  ['Baker Meadow', 'QB', 85], ['Caleb Willson', 'QB', 91], ['Drake May', 'QB', 88],
  ['Jayden Daniel', 'QB', 93], ['Bo Nick', 'QB', 86],
  // Running Backs
  ['Chris McCaffery', 'RB', 97], ['Saquan Barkly', 'RB', 96], ['Derek Henry', 'RB', 94],
  ['Bijon Robinson', 'RB', 93], ['Jamir Gibbs', 'RB', 92], ['Jon Taylor', 'RB', 91],
  ['Nick Chubbs', 'RB', 90], ['Bree Hall', 'RB', 89], ['Josh Jacob', 'RB', 87],
  ['Kenny Walker', 'RB', 86],
  // Wide Receivers
  ['Justin Jeffers', 'WR', 97], ['Jamar Chase', 'WR', 96], ['Tyreek Hills', 'WR', 95],
  ['C.D. Lamb', 'WR', 95], ['Amon Saint Brown', 'WR', 93], ['Luka Nakua', 'WR', 92],
  ['Mike Evan', 'WR', 90], ['Garrett Wilton', 'WR', 89], ['D.J. Moor', 'WR', 87],
  ['A.J. Browne', 'WR', 88], ['Devante Adamson', 'WR', 87], ['Chris Olive', 'WR', 86],
  ['Marvin Harrison II', 'WR', 90], ['Malik Naber', 'WR', 89],
  // Tight Ends
  ['Travis Kelsey', 'TE', 96], ['George Kittles', 'TE', 93], ['Sam Laporta', 'TE', 90],
  ['Mark Andrew', 'TE', 88], ['Brock Bower', 'TE', 91],
  // Defense
  ['Micah Parson', 'LB', 96], ['T.J. Watts', 'DE', 95], ['Max Crosby', 'DE', 93],
  ['Nick Bosan', 'DE', 92], ['Myles Garrettson', 'DE', 91],
];

const RARE_INSERT_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

function makeSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildPlayer({ name, position, overall, tier, rng, curated = false }) {
  const team = pick(rng, TEAMS);
  const year = pick(rng, RARE_INSERT_YEARS);
  const isRookie = tier === 'rookie';
  return {
    id: `plyr_${makeSlug(name)}_${position}`,
    name,
    position,
    teamId: team.id,
    overall,
    tier, // legend | star | starter | rookie | depth
    rookieYear: year,
    isRookie,
    curated,
  };
}

function buildUniverse() {
  const rng = mulberry32(WORLD_SEED);
  const players = [];
  const usedNames = new Set();

  // 1. Signature stars (legend/star tier depending on overall)
  for (const [name, position, overall] of SIGNATURE_STARS) {
    usedNames.add(name);
    const tier = overall >= 95 ? 'legend' : overall >= 90 ? 'star' : 'starter';
    players.push(buildPlayer({ name, position, overall, tier, rng, curated: true }));
  }

  // 2. Procedurally rounded-out roster across every position, weighted so
  // the total exceeds 350 unique fictional players.
  const targetTotal = 420;
  const tierRoll = [
    { value: 'star', weight: 6 },
    { value: 'starter', weight: 28 },
    { value: 'rookie', weight: 16 },
    { value: 'depth', weight: 50 },
  ];

  let guard = 0;
  while (players.length < targetTotal && guard < 20000) {
    guard++;
    const first = pick(rng, FIRST_NAMES);
    const last = pick(rng, LAST_NAMES);
    const name = `${first} ${last}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);

    const position = pickWeighted(rng, POSITIONS.map(p => ({ value: p.code, weight: p.weight })));
    const tier = pickWeighted(rng, tierRoll);
    let overall;
    switch (tier) {
      case 'star': overall = randInt(rng, 88, 94); break;
      case 'starter': overall = randInt(rng, 78, 87); break;
      case 'rookie': overall = randInt(rng, 70, 86); break;
      default: overall = randInt(rng, 55, 77); break;
    }
    players.push(buildPlayer({ name, position, overall, tier, rng }));
  }

  return players;
}

export const PLAYERS = buildUniverse();

export function getPlayer(id) {
  return PLAYERS.find(p => p.id === id);
}

export const CURATED_PLAYERS = PLAYERS.filter(p => p.curated);

export const PLAYERS_BY_TIER = {
  legend: PLAYERS.filter(p => p.tier === 'legend'),
  star: PLAYERS.filter(p => p.tier === 'star'),
  starter: PLAYERS.filter(p => p.tier === 'starter'),
  rookie: PLAYERS.filter(p => p.tier === 'rookie'),
  depth: PLAYERS.filter(p => p.tier === 'depth'),
};
