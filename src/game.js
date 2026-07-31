// The game controller: owns state, wires systems together, and exposes a
// small action API the UI screens call into. UI never mutates state
// directly — it always goes through here so saves/achievements/stats stay
// consistent no matter which screen triggered the change.

import { createNewGame } from './systems/state.js';
import * as StateSys from './systems/state.js';
import { advanceMarketDay, cardMarketValue, priceHistoryFor } from './systems/economy.js';
import { openBox } from './systems/packOpening.js';
import { getBox } from './data/boxes.js';
import * as Selling from './systems/selling.js';
import * as Marketplace from './systems/marketplace.js';
import * as ShopJob from './systems/shopJob.js';
import * as PlayerStore from './systems/playerStore.js';
import * as Binder from './systems/binder.js';
import { checkAchievements } from './systems/achievementsEngine.js';
import { saveSlot, startAutosave } from './systems/save.js';
import { bus } from './systems/eventBus.js';
import { showToast } from './ui/toast.js';
import { money } from './utils/format.js';
import { getGrail, makeGrailCard } from './data/grails.js';
import { burstConfetti } from './ui/confetti.js';
import { sfx } from './systems/sound.js';

export class Game {
  constructor(state) {
    this.state = state;
    this.currentScreen = 'home';
    this.screenParams = {};
    this.listeners = new Set();
    this._wireEvents();
    if (!this.state.marketplace.dailyOffers || !this.state.marketplace.dailyOffers.length) {
      Marketplace.refreshDailyOffers(this.state);
    }
  }

  static fromNew(slotId, name) {
    return new Game(createNewGame(slotId, name));
  }

  static fromSave(saveData) {
    return new Game(saveData);
  }

  _wireEvents() {
    bus.on('toast', ({ text, kind }) => showToast({ text, kind }));
    bus.on('set-completed', ({ type, name }) => {
      const reward = Binder.completionRewardFor(type);
      StateSys.addCash(this.state, reward);
      showToast({ text: `Set complete: ${name}! +${money(reward)}`, kind: 'gold', duration: 4500 });
    });
    bus.on('achievements-unlocked', (list) => {
      for (const a of list) {
        showToast({ text: `Achievement unlocked: ${a.name}`, kind: 'gold', duration: 4000 });
      }
    });
  }

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  notify() { this.listeners.forEach(fn => fn()); }

  setScreen(key, params = {}) {
    this.currentScreen = key;
    this.screenParams = params;
    this.notify();
  }

  save() {
    const ok = saveSlot(this.state.slotId, this.state);
    // Warn once per session rather than on every autosave tick.
    if (!ok && !this._warnedStorage) {
      this._warnedStorage = true;
      showToast({
        text: 'Could not save — device storage is full or blocked. Selling cards frees space.',
        kind: 'danger',
        duration: 7000,
      });
    }
    return ok;
  }

  startAutosave() {
    startAutosave(() => this.state, 30000);
  }

  cardValue(card) {
    return cardMarketValue(card, this.state.market);
  }

  priceHistory(playerId) {
    return priceHistoryFor(this.state.market, playerId);
  }

  recalcAll() {
    StateSys.computeNetWorth(this.state, (c) => this.cardValue(c));
    Binder.recomputeCollectionStats(this.state);
    checkAchievements(this.state);
  }

  /** Settings default to on for saves made before the stipend existed. */
  stipendEnabled() {
    return this.state.settings.dailyStipend !== false;
  }

  setStipendEnabled(on) {
    this.state.settings.dailyStipend = on;
    this.save();
    this.notify();
  }

  /**
   * The floor is the flat $1M stipend; above that it scales with net worth so
   * grail-tier prices stay reachable once the ladder is underway.
   */
  nextDailyPayout() {
    if (!this.stipendEnabled()) return 0;
    const scaled = (this.state.stats.netWorth || 0) * StateSys.DAILY_PAYOUT_RATE;
    return Math.max(StateSys.DAILY_STIPEND, scaled);
  }

  // --- Day / time progression -------------------------------------------
  advanceDay() {
    this.state.day += 1;
    advanceMarketDay(this.state.market);
    const income = PlayerStore.collectPassiveIncome(this.state);
    const stipend = this.nextDailyPayout();
    if (stipend > 0) StateSys.addCash(this.state, stipend);
    Selling.resolveDueAuctions(this.state);
    Marketplace.refreshDailyOffers(this.state);
    this.recalcAll();
    if (stipend > 0) showToast({ text: `Daily payout: +${money(stipend)}`, kind: 'gold', duration: 4000 });
    if (income > 0) showToast({ text: `Store passive income: +${money(income)}`, kind: 'success' });
    this.save();
    this.notify();
  }

  /** Runs seven day-ticks, reporting one combined payout instead of seven toasts. */
  advanceWeek() {
    let totalPayout = 0;
    for (let i = 0; i < 7; i++) {
      this.state.day += 1;
      advanceMarketDay(this.state.market);
      PlayerStore.collectPassiveIncome(this.state);
      const payout = this.nextDailyPayout();
      if (payout > 0) StateSys.addCash(this.state, payout);
      totalPayout += payout;
      Selling.resolveDueAuctions(this.state);
      StateSys.computeNetWorth(this.state, (c) => this.cardValue(c));
    }
    Marketplace.refreshDailyOffers(this.state);
    this.recalcAll();
    if (totalPayout > 0) showToast({ text: `7 days of payouts: +${money(totalPayout)}`, kind: 'gold', duration: 4500 });
    this.save();
    this.notify();
  }

  // --- Boxes ---------------------------------------------------------------
  buyBox(boxKey) {
    const box = getBox(boxKey);
    if (!box) return { ok: false };
    if (!StateSys.spendCash(this.state, box.price)) {
      showToast({ text: 'Not enough cash for that box.', kind: 'danger' });
      return { ok: false, reason: 'insufficient-funds' };
    }
    this.state.stats.totalBoxesOpened += 1;
    this.state.stats.boxesByType[boxKey] = (this.state.stats.boxesByType[boxKey] || 0) + 1;
    const packs = openBox(box, this.state.day);
    this.recalcAll();
    this.notify();
    return { ok: true, box, packs };
  }

  recordPackOpened() {
    this.state.stats.totalPacksOpened += 1;
  }

  collectCard(card) {
    const result = StateSys.recordCardCollected(this.state, card);
    this.recalcAll();
    return result;
  }

  finishOpening() {
    this.recalcAll();
    this.save();
    this.notify();
  }

  // --- The Vault ---------------------------------------------------------
  buyGrail(key) {
    const grail = getGrail(key);
    if (!grail) return { ok: false, reason: 'unknown-grail' };
    if (!this.state.grailsOwned) this.state.grailsOwned = [];
    if (this.state.grailsOwned.includes(key)) return { ok: false, reason: 'already-owned' };
    if (!StateSys.spendCash(this.state, grail.price)) {
      showToast({ text: 'Not enough cash for that grail.', kind: 'danger' });
      return { ok: false, reason: 'insufficient-funds' };
    }
    this.state.grailsOwned.push(key);
    this.state.stats.grailsOwned = [...this.state.grailsOwned];
    const card = makeGrailCard(grail, this.state.day);
    StateSys.recordCardCollected(this.state, card);
    burstConfetti(200);
    sfx.announcer();
    showToast({ text: `${grail.name} secured for ${money(grail.price)}!`, kind: 'gold', duration: 6000 });
    this.recalcAll();
    this.save();
    this.notify();
    return { ok: true, card };
  }

  // --- Selling ---------------------------------------------------------
  sellInstant(uid) {
    const res = Selling.sellInstant(this.state, uid, this.state.market);
    if (res.ok) showToast({ text: `Sold for ${money(res.price)}`, kind: 'success' });
    this.recalcAll();
    this.notify();
    return res;
  }

  tradeCard(uid) {
    const res = Selling.tradeCard(this.state, uid, this.state.market);
    if (res.ok) showToast({ text: `Traded for ${money(res.price)}`, kind: 'success' });
    this.recalcAll();
    this.notify();
    return res;
  }

  startAuction(uid) {
    const res = Selling.startAuction(this.state, uid, this.state.market);
    if (res.ok) showToast({ text: `Auction started, ends day ${res.auction.endsOnDay}`, kind: 'default' });
    this.notify();
    return res;
  }

  toggleFavorite(uid) { Selling.toggleFavorite(this.state, uid); this.notify(); }
  toggleLock(uid) { Selling.toggleLock(this.state, uid); this.notify(); }

  /** Sells the entire collection at buylist price (skips locked/favorited cards). */
  sellEntireCollection() {
    const sellable = this.state.ownedCards.filter(c => !c.locked && !c.favorite);
    let sold = 0;
    let total = 0;
    for (const card of [...sellable]) {
      const res = Selling.sellInstant(this.state, card.uid, this.state.market);
      if (res.ok) { sold += 1; total += res.price; }
    }
    if (sold > 0) {
      showToast({ text: `Sold ${sold} cards for ${money(total)}`, kind: 'success', duration: 4500 });
    } else {
      showToast({ text: 'Nothing sellable (locked/favorited cards are kept).', kind: 'default' });
    }
    this.recalcAll();
    this.notify();
    return { sold, total };
  }

  /** Bulk-sells every duplicate copy (keeps one of each card, skips locked/favorited). */
  sellAllDuplicates() {
    const byKey = new Map();
    for (const card of this.state.ownedCards) {
      if (!byKey.has(card.key)) byKey.set(card.key, []);
      byKey.get(card.key).push(card);
    }
    let sold = 0;
    let total = 0;
    for (const copies of byKey.values()) {
      if (copies.length < 2) continue;
      // Keep the most valuable copy; sell the rest.
      copies.sort((a, b) => this.cardValue(b) - this.cardValue(a));
      for (const dup of copies.slice(1)) {
        if (dup.locked || dup.favorite) continue;
        const res = Selling.sellInstant(this.state, dup.uid, this.state.market);
        if (res.ok) { sold += 1; total += res.price; }
      }
    }
    if (sold > 0) {
      showToast({ text: `Sold ${sold} duplicates for ${money(total)}`, kind: 'success' });
    } else {
      showToast({ text: 'No sellable duplicates found.', kind: 'default' });
    }
    this.recalcAll();
    this.notify();
    return { sold, total };
  }

  fulfillOffer(offerId, uid) {
    const res = Marketplace.fulfillOffer(this.state, offerId, uid, this.state.market);
    if (res.ok) showToast({ text: `Sold to collector for ${money(res.price)}`, kind: 'success' });
    this.recalcAll();
    this.notify();
    return res;
  }

  // --- Shop job ----------------------------------------------------------
  applyForJob() { const r = ShopJob.applyForJob(this.state); this.notify(); return r; }
  generateShift() { const r = ShopJob.generateShift(this.state); this.notify(); return r; }
  negotiate(customerId, stance) { const r = ShopJob.negotiate(this.state, customerId, stance); this.notify(); return r; }
  endShift() { const r = ShopJob.endShift(this.state); this.recalcAll(); this.notify(); return r; }
  promote() { const r = ShopJob.promote(this.state); this.recalcAll(); this.notify(); return r; }
  eligibleForPromotion() { return ShopJob.eligibleForPromotion(this.state); }

  // --- Player store --------------------------------------------------------
  purchaseUpgrade(key) {
    const r = PlayerStore.purchaseUpgrade(this.state, key);
    if (!r.ok) showToast({ text: 'Cannot purchase upgrade.', kind: 'danger' });
    this.notify();
    return r;
  }
}
