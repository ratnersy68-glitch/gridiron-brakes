// Instant sell, auctions, and trades. All three end with cash in hand (or,
// for auctions, a pending listing) and update the shared economy/binder
// stats. Cards remain in everCollectedKeys forever even after being sold —
// only ownedCards (current inventory) shrinks.

import { cardMarketValue } from './economy.js';
import { removeOwnedCard, addCash } from './state.js';
import { bus } from './eventBus.js';

const INSTANT_SELL_CUT = 0.88; // buylist haircut vs. true market value
const TRADE_BONUS = 1.15;
const AUCTION_MIN_DAYS = 2;
const AUCTION_MAX_DAYS = 4;

export function quoteInstantSell(card, market) {
  return Math.max(1, Math.round(cardMarketValue(card, market) * INSTANT_SELL_CUT));
}

export function sellInstant(state, uid, market) {
  const card = state.ownedCards.find(c => c.uid === uid);
  if (!card) return { ok: false, reason: 'not-found' };
  if (card.locked) return { ok: false, reason: 'locked' };
  const price = quoteInstantSell(card, market);
  removeOwnedCard(state, uid);
  addCash(state, price);
  state.stats.biggestSale = Math.max(state.stats.biggestSale, price);
  bus.emit('card-sold', { card, price, method: 'instant' });
  return { ok: true, price };
}

export function tradeCard(state, uid, market) {
  const card = state.ownedCards.find(c => c.uid === uid);
  if (!card) return { ok: false, reason: 'not-found' };
  if (card.locked) return { ok: false, reason: 'locked' };
  const price = Math.max(1, Math.round(cardMarketValue(card, market) * TRADE_BONUS));
  removeOwnedCard(state, uid);
  addCash(state, price);
  state.stats.tradesMade += 1;
  state.stats.biggestSale = Math.max(state.stats.biggestSale, price);
  bus.emit('card-sold', { card, price, method: 'trade' });
  return { ok: true, price };
}

export function startAuction(state, uid, market, rng = Math.random) {
  const card = state.ownedCards.find(c => c.uid === uid);
  if (!card) return { ok: false, reason: 'not-found' };
  if (card.locked) return { ok: false, reason: 'locked' };
  removeOwnedCard(state, uid);
  const days = AUCTION_MIN_DAYS + Math.floor(rng() * (AUCTION_MAX_DAYS - AUCTION_MIN_DAYS + 1));
  const startingValue = cardMarketValue(card, market);
  const auction = {
    id: `auc_${card.uid}`,
    card,
    startingValue,
    endsOnDay: state.day + days,
    resolved: false,
  };
  state.marketplace.auctions.push(auction);
  bus.emit('auction-started', { auction });
  return { ok: true, auction };
}

// Rarer cards swing further above (and slightly below) market since demand
// for chase cards is spikier than for commons.
function auctionOutcomeMultiplier(rarityKey, rng) {
  const spread = {
    common: [0.7, 1.15], uncommon: [0.75, 1.3], rare: [0.8, 1.6], epic: [0.85, 2.1],
    legendary: [0.9, 2.8], mythic: [1, 3.6], impossible: [1.1, 4.5], oneofone: [1.3, 6],
  }[rarityKey] || [0.8, 1.3];
  return spread[0] + rng() * (spread[1] - spread[0]);
}

export function resolveDueAuctions(state, rng = Math.random) {
  const results = [];
  for (const auction of state.marketplace.auctions) {
    if (auction.resolved || auction.endsOnDay > state.day) continue;
    const mult = auctionOutcomeMultiplier(auction.card.rarityKey, rng);
    const price = Math.max(1, Math.round(auction.startingValue * mult));
    auction.resolved = true;
    auction.finalPrice = price;
    addCash(state, price);
    state.stats.auctionsWon += 1;
    state.stats.biggestSale = Math.max(state.stats.biggestSale, price);
    results.push(auction);
    bus.emit('auction-resolved', { auction });
  }
  state.marketplace.auctions = state.marketplace.auctions.filter(a => !a.resolved || (state.day - a.endsOnDay) < 7);
  return results;
}

export function toggleFavorite(state, uid) {
  const card = state.ownedCards.find(c => c.uid === uid);
  if (!card) return;
  card.favorite = !card.favorite;
}

export function toggleLock(state, uid) {
  const card = state.ownedCards.find(c => c.uid === uid);
  if (!card) return;
  card.locked = !card.locked;
}
