// Market simulation. Every player has a "stock index" that random-walks over
// time (nudged by events like weekend/holiday drops). A card's live market
// value is its base value times its player's current index. History is kept
// per-player so the binder can show a price chart for any card of theirs.

import { PLAYERS } from '../data/players.js';

const HISTORY_MAX_POINTS = 60;
const DRIFT_STEP = 0.045;
const MIN_INDEX = 0.35;
const MAX_INDEX = 3.2;

export function createMarketState() {
  const playerIndex = {};
  const history = {};
  for (const p of PLAYERS) {
    playerIndex[p.id] = 1;
    history[p.id] = [{ day: 0, value: 1 }];
  }
  return { playerIndex, history, day: 0, event: null };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function gaussianish(rng) {
  // Sum of uniforms approximates a bell curve without needing Box-Muller.
  return (rng() + rng() + rng() - 1.5) / 1.5;
}

export function advanceMarketDay(market, rng = Math.random) {
  market.day += 1;
  // Small chance of a themed event that biases the whole market briefly.
  if (!market.event && rng() < 0.04) {
    market.event = {
      name: rng() < 0.5 ? 'Weekend Frenzy' : 'Holiday Mystery Drop',
      daysLeft: 2,
      mult: 1 + rng() * 0.25,
    };
  }
  const eventMult = market.event ? market.event.mult : 1;

  for (const p of PLAYERS) {
    const cur = market.playerIndex[p.id] ?? 1;
    const tierPull = p.tier === 'legend' ? 1.002 : p.tier === 'star' ? 1.0005 : 1;
    const next = clamp(cur * tierPull + gaussianish(rng) * DRIFT_STEP * eventMult, MIN_INDEX, MAX_INDEX);
    market.playerIndex[p.id] = next;
    const hist = market.history[p.id] || (market.history[p.id] = []);
    hist.push({ day: market.day, value: next });
    if (hist.length > HISTORY_MAX_POINTS) hist.shift();
  }

  if (market.event) {
    market.event.daysLeft -= 1;
    if (market.event.daysLeft <= 0) market.event = null;
  }
  return market;
}

export function playerIndexOf(market, playerId) {
  return market.playerIndex[playerId] ?? 1;
}

export function cardMarketValue(card, market) {
  const idx = playerIndexOf(market, card.playerId);
  return Math.max(1, Math.round(card.baseValue * idx));
}

export function priceHistoryFor(market, playerId) {
  return market.history[playerId] || [];
}
