// The full Gridiron Breaks player universe: curated signature stars plus a
// large procedurally-rounded-out roster, all wholly fictional. Deterministic
// seed keeps the universe stable across reloads/saves.

import { TEAMS } from './teams.js';
import { FIRST_NAMES, LAST_NAMES, POSITIONS } from './names.js';
import { mulberry32, pick, pickWeighted, randInt } from '../utils/rng.js';

const WORLD_SEED = 194831;

// Curated signature stars — the "chase" names of the game, each hand-placed
// at a high overall so they anchor the checklist and market. The 4th field
// pins each star to the fictional analog of their real-life club (e.g. the
// Kansas Comets are this universe's Kansas City team), so the parody names
// land on the roster fans expect.
const SIGNATURE_STARS = [
  // Quarterbacks
  ['Patty Myhome', 'QB', 99, 'com'], ['Josh Allin', 'QB', 97, 'blz'], ['Lamar Jackman', 'QB', 96, 'rvn'],
  ['Joey Burrows', 'QB', 95, 'bng'], ['Justin Harbor', 'QB', 94, 'bol'], ['Jaylen Hart', 'QB', 93, 'lib'],
  ['C.J. Strong', 'QB', 92, 'txn'], ['Trevor Laurence', 'QB', 91, 'jag'], ['Brock Pure', 'QB', 90, 'gld'],
  ['Dax Prescott', 'QB', 90, 'lng'], ['Tua Tagalo', 'QB', 89, 'wav'], ['Jordan Lovell', 'QB', 88, 'lmb'],
  ['Aaron Rodger', 'QB', 92, 'stl2'], ['Matt Stafforde', 'QB', 87, 'rms'], ['Kyler Murry', 'QB', 86, 'crd'],
  ['Baker Meadow', 'QB', 85, 'lgt'], ['Caleb Willson', 'QB', 91, 'wnd'], ['Drake May', 'QB', 88, 'pat'],
  ['Jayden Daniel', 'QB', 93, 'stl'], ['Bo Nick', 'QB', 86, 'brn'],
  // Running Backs
  ['Chris McCaffery', 'RB', 97, 'gld'], ['Saquan Barkly', 'RB', 96, 'lib'], ['Derek Henry', 'RB', 94, 'rvn'],
  ['Bijon Robinson', 'RB', 93, 'atk'], ['Jamir Gibbs', 'RB', 92, 'mtr'], ['Jon Taylor', 'RB', 91, 'stl3'],
  ['Nick Chubbs', 'RB', 90, 'clv'], ['Bree Hall', 'RB', 89, 'nyk'], ['Josh Jacob', 'RB', 87, 'lmb'],
  ['Kenny Walker', 'RB', 86, 'stm'],
  // Wide Receivers
  ['Justin Jeffers', 'WR', 97, 'vik'], ['Jamar Chase', 'WR', 96, 'bng'], ['Tyreek Hills', 'WR', 95, 'wav'],
  ['C.D. Lamb', 'WR', 95, 'lng'], ['Amon Saint Brown', 'WR', 93, 'mtr'], ['Luka Nakua', 'WR', 92, 'rms'],
  ['Mike Evan', 'WR', 90, 'lgt'], ['Garrett Wilton', 'WR', 89, 'nyk'], ['D.J. Moor', 'WR', 87, 'wnd'],
  ['A.J. Browne', 'WR', 88, 'lib'], ['Devante Adamson', 'WR', 87, 'rdr'], ['Chris Olive', 'WR', 86, 'brs'],
  ['Marvin Harrison II', 'WR', 90, 'crd'], ['Malik Naber', 'WR', 89, 'grz'],
  // Tight Ends
  ['Travis Kelsey', 'TE', 96, 'com'], ['George Kittles', 'TE', 93, 'gld'], ['Sam Laporta', 'TE', 90, 'mtr'],
  ['Mark Andrew', 'TE', 88, 'rvn'], ['Brock Bower', 'TE', 91, 'rdr'],
  // Defense
  ['Micah Parson', 'LB', 96, 'lng'], ['T.J. Watts', 'DE', 95, 'stl2'], ['Max Crosby', 'DE', 93, 'rdr'],
  ['Nick Bosan', 'DE', 92, 'gld'], ['Myles Garrettson', 'DE', 91, 'clv'],
];

const RARE_INSERT_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

function makeSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildPlayer({ name, position, overall, tier, rng, curated = false, teamId = null }) {
  // Always consume the rng draw so the procedural roster stays on the same
  // seeded stream whether or not this player has a pinned team.
  const rolledTeam = pick(rng, TEAMS);
  const team = teamId ? (TEAMS.find(t => t.id === teamId) || rolledTeam) : rolledTeam;
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

  // 1. Signature stars (legend/star tier depending on overall), each pinned
  // to the fictional analog of their real-life club.
  for (const [name, position, overall, teamId] of SIGNATURE_STARS) {
    usedNames.add(name);
    const tier = overall >= 95 ? 'legend' : overall >= 90 ? 'star' : 'starter';
    players.push(buildPlayer({ name, position, overall, tier, rng, curated: true, teamId }));
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
