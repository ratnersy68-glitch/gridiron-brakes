// Once the player owns the shop (career stage 4+), they can sink cash into
// upgrades that generate passive income per in-game day. Each upgrade line
// has 5 levels with an escalating cost and a flat per-level daily payout.

export const UPGRADE_DEFS = [
  { key: 'shelves', label: 'Shelves', baseCost: 800, perLevelIncome: 15, blurb: 'More shelf space, more product on display.' },
  { key: 'displays', label: 'Display Cases', baseCost: 1200, perLevelIncome: 22, blurb: 'Showcase your best hits to walk-in buyers.' },
  { key: 'storage', label: 'Storage', baseCost: 900, perLevelIncome: 12, blurb: 'Keep more inventory ready to sell.' },
  { key: 'security', label: 'Security', baseCost: 1500, perLevelIncome: 10, blurb: 'Protect the vault-tier inventory.' },
  { key: 'employees', label: 'Employees', baseCost: 2500, perLevelIncome: 40, blurb: 'Extra staff run shifts even when you\'re not there.' },
  { key: 'advertising', label: 'Advertising', baseCost: 1800, perLevelIncome: 25, blurb: 'Bring in more foot traffic and online buyers.' },
  { key: 'website', label: 'Website', baseCost: 3000, perLevelIncome: 35, blurb: 'Sell singles and boxes online, 24/7.' },
  { key: 'shipping', label: 'Shipping', baseCost: 2200, perLevelIncome: 30, blurb: 'Fast, insured shipping for online orders.' },
  { key: 'tradeShowBooths', label: 'Trade Show Booths', baseCost: 4000, perLevelIncome: 50, blurb: 'Set up at conventions across the country.' },
];

export const MAX_LEVEL = 5;

export function upgradeCost(defKey, currentLevel) {
  const def = UPGRADE_DEFS.find(d => d.key === defKey);
  return Math.round(def.baseCost * Math.pow(1.85, currentLevel));
}

export function totalPassiveIncomePerDay(state) {
  return UPGRADE_DEFS.reduce((sum, def) => sum + (state.store.upgrades[def.key] || 0) * def.perLevelIncome, 0);
}

export function purchaseUpgrade(state, key) {
  const level = state.store.upgrades[key] || 0;
  if (level >= MAX_LEVEL) return { ok: false, reason: 'maxed' };
  const cost = upgradeCost(key, level);
  if (state.cash < cost) return { ok: false, reason: 'insufficient-funds' };
  state.cash -= cost;
  state.stats.totalMoneySpent += cost;
  state.store.upgrades[key] = level + 1;
  state.stats.storeUpgrades[key] = level + 1;
  return { ok: true, newLevel: level + 1, cost };
}

export function collectPassiveIncome(state) {
  if (state.shop.careerStage < 4) return 0;
  const income = totalPassiveIncomePerDay(state);
  if (income > 0) state.cash += income;
  if (income > 0) state.stats.totalMoneyEarned += income;
  return income;
}
