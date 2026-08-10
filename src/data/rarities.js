// Rarity ladder shared by every card type. Weights are relative (not
// percentages) — the pack resolver normalizes them per-box after applying
// that box's odds modifier. Higher tiers carry much higher value multipliers
// to reward the payoff of a rare pull.

// Baseline weights are modeled on real retail pull rates: ~80% commons,
// hits are genuinely scarce (a real premium hobby box of ~144 cards averages
// only ~2 autos and ~10 numbered parallels; case-hit inserts run 1-in-
// thousands of cards). Box oddsMult shifts these, but never into easy money.
export const RARITIES = [
  { key: 'common', label: 'Common', weight: 80000, color: '#9aa0a6', valueMult: 1, glow: false },
  { key: 'uncommon', label: 'Uncommon', weight: 14000, color: '#4caf50', valueMult: 2.2, glow: false },
  { key: 'rare', label: 'Rare', weight: 4500, color: '#2f9bff', valueMult: 5, glow: true },
  { key: 'epic', label: 'Epic', weight: 1050, color: '#a259ff', valueMult: 14, glow: true },
  { key: 'legendary', label: 'Legendary', weight: 300, color: '#ffb100', valueMult: 45, glow: true },
  { key: 'mythic', label: 'Mythic', weight: 80, color: '#ff4d6d', valueMult: 140, glow: true },
  { key: 'impossible', label: 'Impossible', weight: 20, color: '#00e5ff', valueMult: 420, glow: true },
  { key: 'oneofone', label: 'One-of-One', weight: 2, color: '#ffffff', valueMult: 2200, glow: true },
  // Grails sit above the pull ladder entirely: weight 0 means they can never
  // come out of a pack. They are acquired only from the Vault.
  { key: 'grail', label: 'Grail', weight: 0, color: '#ffd76a', valueMult: 0, glow: true },
];

export const RARITY_ORDER = RARITIES.map(r => r.key);

export function getRarity(key) {
  return RARITIES.find(r => r.key === key);
}

export function rarityIndex(key) {
  return RARITY_ORDER.indexOf(key);
}
