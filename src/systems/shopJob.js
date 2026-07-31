// The card shop job: the player's fallback income when packs run dry.
// Working a shift spawns a handful of customers looking to sell their
// collections; the player negotiates each one (lowball / fair / generous),
// trading acceptance odds against profit margin. Career stage gates
// wage scale, commission rate, and eventually ownership of the shop itself.

import { addCash } from './state.js';
import { bus } from './eventBus.js';
import { randInt, pick } from '../utils/rng.js';

export const CAREER_STAGES = [
  { stage: 0, title: 'Unemployed' },
  { stage: 1, title: 'Shop Employee', wage: 60, commission: 0.2, promoteAt: { shiftsWorked: 10 } },
  { stage: 2, title: 'Shift Lead', wage: 90, commission: 0.3, promoteAt: { shiftsWorked: 25 } },
  { stage: 3, title: 'Store Manager', wage: 130, commission: 0.45, promoteAt: { buyoutCash: 50000 } },
  { stage: 4, title: 'Shop Owner', wage: 0, commission: 1.0, promoteAt: { netWorth: 2000000, upgradesMaxed: true } },
  { stage: 5, title: 'Owner of the Largest Shop in the Game', wage: 0, commission: 1.0 },
];

const CUSTOMER_NAMES = [
  'Danny from Ohio', 'Old Man Fitzgerald', 'Teenage Marcus', 'Cousin Ray', 'The Regular',
  'Weekend Warrior Wade', 'First-Timer Priya', 'Estate Sale Earl', 'Nervous Nina', 'Flea Market Fred',
  'Collector Carla', 'Grad Student Theo', 'Retired Coach Lou', 'Speculator Sam', 'Garage Sale Gary',
];

export function currentStageInfo(careerStage) {
  return CAREER_STAGES.find(s => s.stage === careerStage) || CAREER_STAGES[0];
}

export function applyForJob(state) {
  if (state.shop.careerStage >= 1) return { ok: false, reason: 'already-hired' };
  state.shop.careerStage = 1;
  state.stats.careerStage = 1;
  bus.emit('toast', { text: 'Hired at the local card shop!', kind: 'success' });
  return { ok: true };
}

export function eligibleForPromotion(state) {
  const stage = currentStageInfo(state.shop.careerStage);
  const next = CAREER_STAGES.find(s => s.stage === state.shop.careerStage + 1);
  if (!next || !stage.promoteAt) return next && !stage.promoteAt ? next : null;
  const req = stage.promoteAt;
  if (req.shiftsWorked && state.shop.shiftsWorked < req.shiftsWorked) return null;
  if (req.buyoutCash && state.cash < req.buyoutCash) return null;
  if (req.netWorth && state.stats.netWorth < req.netWorth) return null;
  if (req.upgradesMaxed) {
    const upgrades = state.store.upgrades;
    const maxed = Object.values(upgrades).every(v => v >= 5);
    if (!maxed) return null;
  }
  return next;
}

export function promote(state) {
  const next = eligibleForPromotion(state);
  if (!next) return { ok: false };
  const req = currentStageInfo(state.shop.careerStage).promoteAt;
  if (req?.buyoutCash) state.cash -= req.buyoutCash;
  state.shop.careerStage = next.stage;
  state.stats.careerStage = next.stage;
  bus.emit('toast', { text: `Promoted: ${next.title}!`, kind: 'success' });
  return { ok: true, stage: next };
}

function randomCustomer(state, rng) {
  const stageMult = 1 + state.shop.careerStage * 0.35;
  const lotValue = Math.round(randInt(rng, 20, 260) * stageMult);
  const askInflation = 0.8 + rng() * 0.5;
  return {
    id: `cust_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    name: pick(rng, CUSTOMER_NAMES),
    lotValue,
    askPrice: Math.round(lotValue * askInflation),
    resolved: false,
  };
}

export function generateShift(state, rng = Math.random, count = 4) {
  const customers = new Array(count).fill(null).map(() => randomCustomer(state, rng));
  state.shop.currentShift = { customers, profit: 0, wage: 0 };
  return state.shop.currentShift;
}

const STANCES = {
  lowball: { offerFrac: 0.55, acceptChance: 0.4 },
  fair: { offerFrac: 0.8, acceptChance: 0.78 },
  generous: { offerFrac: 1.0, acceptChance: 0.98 },
};

export function negotiate(state, customerId, stanceKey, rng = Math.random) {
  const shift = state.shop.currentShift;
  if (!shift) return { ok: false, reason: 'no-shift' };
  const customer = shift.customers.find(c => c.id === customerId);
  if (!customer || customer.resolved) return { ok: false, reason: 'invalid-customer' };
  const stance = STANCES[stanceKey];
  const offer = Math.round(customer.askPrice * stance.offerFrac);
  const accepted = rng() < stance.acceptChance;
  customer.resolved = true;
  customer.stance = stanceKey;
  customer.offer = offer;
  customer.accepted = accepted;

  let profit = 0;
  if (accepted) {
    const resaleValue = Math.round(customer.lotValue * 1.15);
    profit = resaleValue - offer;
    shift.profit += profit;
    customer.profit = profit;
  }
  return { ok: true, accepted, offer, profit };
}

export function endShift(state) {
  const shift = state.shop.currentShift;
  if (!shift) return { ok: false };
  const stageInfo = currentStageInfo(state.shop.careerStage);
  const wage = stageInfo.wage || 0;
  const commission = Math.round(Math.max(0, shift.profit) * stageInfo.commission);
  const total = wage + commission;
  addCash(state, total);
  state.shop.shiftsWorked += 1;
  state.shop.totalWagesEarned += total;
  state.shop.currentShift = null;
  bus.emit('toast', { text: `Shift complete: earned ${total}`, kind: 'success' });
  return { ok: true, wage, commission, total };
}
