// Central game state: shape, factory, and low-level mutators. Higher-level
// behavior (binder set-completion, shop job, store upgrades, marketplace,
// achievements) lives in dedicated system modules and calls into these
// mutators rather than poking state directly, so state.js stays the single
// source of truth for shape + persistence.

import { createMarketState } from './economy.js';
import { bus } from './eventBus.js';

export const SAVE_VERSION = 1;

// Cash handed out every time the player advances a day. Deliberately huge —
// this is a sandbox-style stipend, toggleable from Settings.
export const DAILY_STIPEND = 1_000_000;

const UPGRADE_KEYS = ['shelves', 'displays', 'storage', 'security', 'employees', 'advertising', 'website', 'shipping', 'tradeShowBooths'];

export function createNewGame(slotId, name = 'New Collector') {
  const upgrades = {};
  UPGRADE_KEYS.forEach(k => { upgrades[k] = 0; });

  return {
    version: SAVE_VERSION,
    slotId,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    cash: 100,
    day: 0,
    ownedCards: [],
    everCollectedKeys: [],
    market: createMarketState(),
    stats: {
      totalPacksOpened: 0,
      totalBoxesOpened: 0,
      boxesByType: {},
      totalCardsCollected: 0,
      totalDuplicates: 0,
      rarityPulls: {},
      totalMoneyEarned: 0,
      totalMoneySpent: 0,
      biggestSale: 0,
      netWorth: 100,
      setsCompleted: 0,
      binderCompletionPct: 0,
      teamSetsComplete: [],
      teamSetProgress: {},
      playerMastered: [],
      playerMasterProgress: {},
      autosPulled: 0,
      oneOfOnesPulled: 0,
      careerStage: 0,
      storeUpgrades: upgrades,
      auctionsWon: 0,
      tradesMade: 0,
    },
    shop: {
      careerStage: 0, // 0 none, 1 hired, 2 shift lead, 3 manager, 4 owner, 5 largest shop
      shiftsWorked: 0,
      totalWagesEarned: 0,
      shopInventoryValue: 0,
    },
    store: {
      upgrades,
      lastPassiveCollectDay: 0,
    },
    marketplace: {
      listings: [],
      auctions: [],
    },
    achievementsUnlocked: [],
    settings: { soundOn: true, dailyStipend: true },
  };
}

// --- Core mutators -------------------------------------------------------

export function addCash(state, amount, { earned = true } = {}) {
  state.cash += amount;
  if (amount > 0 && earned) state.stats.totalMoneyEarned += amount;
  state.updatedAt = Date.now();
  bus.emit('cash-changed', { cash: state.cash, delta: amount });
  return state.cash;
}

export function spendCash(state, amount) {
  if (state.cash < amount) return false;
  state.cash -= amount;
  state.stats.totalMoneySpent += amount;
  state.updatedAt = Date.now();
  bus.emit('cash-changed', { cash: state.cash, delta: -amount });
  return true;
}

export function recordCardCollected(state, card) {
  state.ownedCards.push(card);
  state.stats.totalCardsCollected += 1;
  state.stats.rarityPulls[card.rarityKey] = (state.stats.rarityPulls[card.rarityKey] || 0) + 1;
  if (card.category === 'signature') state.stats.autosPulled += 1;
  if (card.rarityKey === 'oneofone') state.stats.oneOfOnesPulled += 1;

  const alreadyEver = state.everCollectedKeys.includes(card.key);
  if (alreadyEver) {
    state.stats.totalDuplicates += 1;
  } else {
    state.everCollectedKeys.push(card.key);
  }
  bus.emit('card-collected', { card, isDuplicate: alreadyEver });
  return { isDuplicate: alreadyEver };
}

export function removeOwnedCard(state, uid) {
  const idx = state.ownedCards.findIndex(c => c.uid === uid);
  if (idx === -1) return null;
  const [card] = state.ownedCards.splice(idx, 1);
  return card;
}

export function computeNetWorth(state, currentValueFn) {
  const cardsValue = state.ownedCards.reduce((sum, c) => sum + currentValueFn(c), 0);
  const net = state.cash + cardsValue;
  state.stats.netWorth = net;
  return net;
}

export function touch(state) { state.updatedAt = Date.now(); }
