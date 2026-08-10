// AI collector marketplace: a small refreshing board of buy requests from
// bot collectors, each paying a premium over instant-sell for a card
// matching their ask (a rarity tier, or a specific curated star). Refreshes
// once per in-game day. Complements economy.js's player-index drift and
// weekend/holiday events for "prices constantly fluctuate."

import { PLAYERS, CURATED_PLAYERS } from '../data/players.js';
import { RARITIES } from '../data/rarities.js';
import { cardMarketValue } from './economy.js';
import { removeOwnedCard, addCash } from './state.js';
import { bus } from './eventBus.js';
import { randInt, pick, pickWeighted } from '../utils/rng.js';

const COLLECTOR_HANDLES = [
  'GridironGoat74', 'BinderBaron', 'RookiePatchQueen', 'VaultVulture', 'ChromeChaser',
  'SundayFlipper', 'ColdCaseCollector', 'ParallelPete', 'AutoAddict22', 'MythicMara',
  'NumberedNate', 'SlabSociety', 'PackWarsVet', 'HobbyHound', 'FirstPickFinch',
];

function randomAsk(rng) {
  const wantsStar = rng() < 0.3;
  if (wantsStar) {
    const star = pick(rng, CURATED_PLAYERS);
    return { kind: 'player', playerId: star.id, label: `Any card of ${star.name}` };
  }
  const rarity = pickWeighted(rng, [
    { value: 'common', weight: 20 }, { value: 'uncommon', weight: 25 }, { value: 'rare', weight: 25 },
    { value: 'epic', weight: 15 }, { value: 'legendary', weight: 8 }, { value: 'mythic', weight: 4 },
    { value: 'impossible', weight: 2 }, { value: 'oneofone', weight: 1 },
  ]);
  const rarityDef = RARITIES.find(r => r.key === rarity);
  return { kind: 'rarity', rarityKey: rarity, label: `Any ${rarityDef.label} card` };
}

export function refreshDailyOffers(state, rng = Math.random, count = 6) {
  const offers = [];
  for (let i = 0; i < count; i++) {
    const ask = randomAsk(rng);
    const premium = 1.15 + rng() * 0.45; // 115%-160% of market value
    offers.push({
      id: `offer_${state.day}_${i}`,
      buyer: pick(rng, COLLECTOR_HANDLES),
      ask,
      premium,
      createdOnDay: state.day,
    });
  }
  state.marketplace.dailyOffers = offers;
  return offers;
}

export function offerMatches(offer, card) {
  if (offer.ask.kind === 'player') return card.playerId === offer.ask.playerId;
  return card.rarityKey === offer.ask.rarityKey;
}

export function quoteOffer(offer, card, market) {
  return Math.max(0.05, Math.round(cardMarketValue(card, market) * offer.premium * 100) / 100);
}

export function fulfillOffer(state, offerId, uid, market) {
  const offer = (state.marketplace.dailyOffers || []).find(o => o.id === offerId);
  if (!offer) return { ok: false, reason: 'offer-not-found' };
  const card = state.ownedCards.find(c => c.uid === uid);
  if (!card) return { ok: false, reason: 'card-not-found' };
  if (card.locked) return { ok: false, reason: 'locked' };
  if (!offerMatches(offer, card)) return { ok: false, reason: 'no-match' };

  const price = quoteOffer(offer, card, market);
  removeOwnedCard(state, uid);
  addCash(state, price);
  state.stats.biggestSale = Math.max(state.stats.biggestSale, price);
  state.marketplace.dailyOffers = state.marketplace.dailyOffers.filter(o => o.id !== offerId);
  bus.emit('card-sold', { card, price, method: 'offer' });
  return { ok: true, price };
}
