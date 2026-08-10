// The Vault: a six-rung ladder of grail cards sitting far above anything a
// pack can produce, priced from one trillion to one quintillion dollars.
// Each is a unique, permanently-numbered 1/1 tied to a signature legend, and
// each carries its own visual treatment (see .grail-* in styles/grail.css).
//
// Grails are never rolled from packs — they can only be bought here, and each
// one can only be owned once. Owning them massively inflates net worth, which
// in turn compounds the daily payout, so the ladder pulls itself upward.

import { CURATED_PLAYERS, PLAYERS_BY_TIER } from './players.js';
import { getTeam } from './teams.js';
import { hashString } from '../utils/rng.js';

const T = 1e12;
const Qa = 1e15;
const Qi = 1e18;

export const GRAILS = [
  {
    key: 'obsidian',
    name: 'Obsidian Grail',
    theme: 'grail-obsidian',
    price: 1 * T,
    tagline: 'Cut from volcanic glass, sealed under black sapphire.',
    blurb: 'The first rung of the Vault. Only one was ever struck.',
    accent: '#8f7bff',
  },
  {
    key: 'aurum',
    name: 'Aurum Grail',
    theme: 'grail-aurum',
    price: 10 * T,
    tagline: 'Twenty-four karat leaf pressed over a mirrored core.',
    blurb: 'Solid gold edge-to-edge. Weighs more than it should.',
    accent: '#ffd76a',
  },
  {
    key: 'celestial',
    name: 'Celestial Grail',
    theme: 'grail-celestial',
    price: 100 * T,
    tagline: 'A window onto a sky that does not exist.',
    blurb: 'The starfield drifts. Collectors swear it changes overnight.',
    accent: '#5fd8ff',
  },
  {
    key: 'eclipse',
    name: 'Eclipse Grail',
    theme: 'grail-eclipse',
    price: 1 * Qa,
    tagline: 'Struck during a total eclipse and never re-struck.',
    blurb: 'A corona burns around a dead-black center.',
    accent: '#ff7a3d',
  },
  {
    key: 'genesis_prime',
    name: 'Genesis Prime',
    theme: 'grail-genesis',
    price: 100 * Qa,
    tagline: 'The proof card. The one every other card was printed from.',
    blurb: 'Held in a vault beneath the league office for forty years.',
    accent: '#7bffcf',
  },
  {
    key: 'singularity',
    name: 'The Singularity',
    theme: 'grail-singularity',
    price: 1 * Qi,
    tagline: 'The most valuable object ever encased in acrylic.',
    blurb: 'There is nothing above this. There is nothing like this.',
    accent: '#ffffff',
  },
];

/** The legend featured on a given grail — fixed forever by seed. */
export function grailPlayer(grail) {
  const pool = PLAYERS_BY_TIER.legend?.length ? PLAYERS_BY_TIER.legend : CURATED_PLAYERS;
  return pool[hashString('grail::' + grail.key) % pool.length];
}

export function getGrail(key) {
  return GRAILS.find(g => g.key === key);
}

/** Builds the owned-card record for a purchased grail. */
export function makeGrailCard(grail, gameDay = 0) {
  const player = grailPlayer(grail);
  return {
    uid: `grail_${grail.key}`,
    key: `grail::${grail.key}`,
    grailKey: grail.key,
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    overall: player.overall,
    teamId: player.teamId,
    teamName: getTeam(player.teamId)?.name || '',
    rookieYear: player.rookieYear,
    isRookie: false,
    category: 'grail',
    typeKey: grail.key,
    typeLabel: grail.name,
    serial: 1,
    printRun: 1,
    rarityKey: 'grail',
    rarityLabel: 'Grail',
    rarityColor: grail.accent,
    baseValue: grail.price,
    marketValue: grail.price,
    boxKey: null,
    source: 'vault',
    pulledOnDay: gameDay,
    favorite: true,
    locked: true, // grails are protected from bulk-sell by default
    createdAt: Date.now(),
  };
}
