// Achievement definitions. Rather than hand-listing every single one, most
// categories are generated from milestone tiers so the list can trivially
// grow (add a tier, add a category) without touching game logic. Each
// achievement has a `check(stats)` predicate run against the persistent
// stats block in game state, plus a `progress(stats)` for partial display.

import { BOXES } from './boxes.js';
import { RARITIES } from './rarities.js';
import { TEAMS } from './teams.js';
import { CURATED_PLAYERS } from './players.js';

const achievements = [];

function tierAchievement({ id, name, desc, stat, tiers, reward }) {
  tiers.forEach((threshold, i) => {
    achievements.push({
      id: `${id}_${threshold}`,
      name: name(threshold),
      desc: desc(threshold),
      category: id,
      icon: '🏆',
      check: (stats) => (stats[stat] || 0) >= threshold,
      progress: (stats) => Math.min(1, (stats[stat] || 0) / threshold),
      reward: reward ? reward(threshold, i) : { cash: threshold * 0.2 },
    });
  });
}

// --- Packs & boxes -----------------------------------------------------
tierAchievement({
  id: 'packs_opened',
  name: (n) => `Pack Opener ${n}`,
  desc: (n) => `Open ${n.toLocaleString()} total packs.`,
  stat: 'totalPacksOpened',
  tiers: [1, 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000],
  reward: (n) => ({ cash: Math.max(5, n * 0.15) }),
});

tierAchievement({
  id: 'boxes_opened',
  name: (n) => `Box Breaker ${n}`,
  desc: (n) => `Open ${n.toLocaleString()} total boxes.`,
  stat: 'totalBoxesOpened',
  tiers: [1, 10, 50, 100, 500, 1000, 2500],
  reward: (n) => ({ cash: n * 2 }),
});

for (const box of BOXES) {
  [1, 10, 50, 100].forEach((n) => {
    achievements.push({
      id: `box_${box.key}_${n}`,
      name: `${box.name} x${n}`,
      desc: `Open ${n} ${box.name} product${n > 1 ? 's' : ''}.`,
      category: 'boxes_by_type',
      icon: '📦',
      check: (stats) => (stats.boxesByType?.[box.key] || 0) >= n,
      progress: (stats) => Math.min(1, (stats.boxesByType?.[box.key] || 0) / n),
      reward: { cash: box.price * n * 0.04 },
    });
  });
}

// --- Card collecting -----------------------------------------------------
tierAchievement({
  id: 'cards_collected',
  name: (n) => `Collector ${n.toLocaleString()}`,
  desc: (n) => `Collect ${n.toLocaleString()} total cards (including duplicates).`,
  stat: 'totalCardsCollected',
  tiers: [1, 25, 100, 500, 1000, 5000, 10000, 25000, 50000, 100000],
});

tierAchievement({
  id: 'duplicates',
  name: (n) => `Duplicate Hoarder ${n}`,
  desc: (n) => `Collect ${n.toLocaleString()} duplicate cards.`,
  stat: 'totalDuplicates',
  tiers: [10, 100, 500, 1000, 5000],
});

for (const rarity of RARITIES) {
  [1, 10, 50, 100, 250].forEach((n) => {
    achievements.push({
      id: `rarity_${rarity.key}_${n}`,
      name: `${rarity.label} Hunter x${n}`,
      desc: `Pull ${n} ${rarity.label} card${n > 1 ? 's' : ''}.`,
      category: 'rarity_pulls',
      icon: '💎',
      check: (stats) => (stats.rarityPulls?.[rarity.key] || 0) >= n,
      progress: (stats) => Math.min(1, (stats.rarityPulls?.[rarity.key] || 0) / n),
      reward: { cash: rarity.valueMult * n * 0.5 },
    });
  });
}

// --- Economy -----------------------------------------------------------
tierAchievement({
  id: 'money_earned',
  name: (n) => `Earner: $${n.toLocaleString()}`,
  desc: (n) => `Earn $${n.toLocaleString()} in total lifetime income.`,
  stat: 'totalMoneyEarned',
  tiers: [1000, 5000, 25000, 100000, 500000, 1000000, 5000000, 25000000, 100000000],
  reward: () => ({ cash: 0 }),
});

tierAchievement({
  id: 'money_spent',
  name: (n) => `Big Spender: $${n.toLocaleString()}`,
  desc: (n) => `Spend $${n.toLocaleString()} on boxes and upgrades.`,
  stat: 'totalMoneySpent',
  tiers: [1000, 5000, 25000, 100000, 500000, 1000000, 5000000],
  reward: () => ({ cash: 0 }),
});

tierAchievement({
  id: 'biggest_sale',
  name: (n) => `Big Sale: $${n.toLocaleString()}`,
  desc: (n) => `Sell a single card for $${n.toLocaleString()} or more.`,
  stat: 'biggestSale',
  tiers: [100, 1000, 10000, 100000, 1000000],
  reward: () => ({ cash: 0 }),
});

achievements.push({
  id: 'first_millionaire',
  name: 'Millionaire Collector',
  desc: 'Reach a net worth of $1,000,000.',
  category: 'milestones',
  icon: '💰',
  check: (stats) => (stats.netWorth || 0) >= 1_000_000,
  progress: (stats) => Math.min(1, (stats.netWorth || 0) / 1_000_000),
  reward: { cash: 0 },
});

achievements.push({
  id: 'first_billionaire',
  name: 'Card Kingpin',
  desc: 'Reach a net worth of $1,000,000,000.',
  category: 'milestones',
  icon: '👑',
  check: (stats) => (stats.netWorth || 0) >= 1_000_000_000,
  progress: (stats) => Math.min(1, (stats.netWorth || 0) / 1_000_000_000),
  reward: { cash: 0 },
});

// --- Binder / sets -------------------------------------------------------
tierAchievement({
  id: 'sets_completed',
  name: (n) => `Set Completionist ${n}`,
  desc: (n) => `Fully complete ${n} binder set${n > 1 ? 's' : ''}.`,
  stat: 'setsCompleted',
  tiers: [1, 5, 10, 25, 50, 100],
  reward: (n) => ({ cash: n * 100 }),
});

[10, 25, 50, 75, 90, 100].forEach((pct) => {
  achievements.push({
    id: `binder_pct_${pct}`,
    name: `Binder ${pct}% Complete`,
    desc: `Reach ${pct}% overall binder completion.`,
    category: 'binder',
    icon: '📖',
    check: (stats) => (stats.binderCompletionPct || 0) >= pct,
    progress: (stats) => Math.min(1, (stats.binderCompletionPct || 0) / pct),
    reward: { cash: pct * 40 },
  });
});

for (const team of TEAMS) {
  achievements.push({
    id: `team_set_${team.id}`,
    name: `${team.name} Super Collector`,
    desc: `Collect at least one base card of every ${team.name} player.`,
    category: 'team_sets',
    icon: '🏟️',
    check: (stats) => (stats.teamSetsComplete || []).includes(team.id),
    progress: (stats) => (stats.teamSetsComplete || []).includes(team.id) ? 1 : (stats.teamSetProgress?.[team.id] || 0),
    reward: { cash: 250 },
  });
}

for (const star of CURATED_PLAYERS) {
  achievements.push({
    id: `player_master_${star.id}`,
    name: `${star.name} Super Collector`,
    desc: `Own every card version of ${star.name}.`,
    category: 'player_sets',
    icon: '⭐',
    check: (stats) => (stats.playerMastered || []).includes(star.id),
    progress: (stats) => (stats.playerMastered || []).includes(star.id) ? 1 : (stats.playerMasterProgress?.[star.id] || 0),
    reward: { cash: 500 },
  });
}

// --- Autos / hits --------------------------------------------------------
tierAchievement({
  id: 'autos_pulled',
  name: (n) => `Autograph Collector ${n}`,
  desc: (n) => `Pull ${n} autographed cards.`,
  stat: 'autosPulled',
  tiers: [1, 5, 25, 100, 500],
});

tierAchievement({
  id: 'oneofones_pulled',
  name: (n) => `One-of-One Club ${n}`,
  desc: (n) => `Pull ${n} One-of-One card${n > 1 ? 's' : ''}.`,
  stat: 'oneOfOnesPulled',
  tiers: [1, 5, 10, 25],
  reward: (n) => ({ cash: n * 1000 }),
});

// --- Shop & store ---------------------------------------------------------
['hired', 'shift_lead', 'manager', 'shop_owner', 'largest_shop'].forEach((stage, i) => {
  achievements.push({
    id: `career_${stage}`,
    name: ['Hired at the Shop', 'Shift Lead', 'Store Manager', 'Shop Owner', 'Largest Shop in the Game'][i],
    desc: [
      'Get your first shift at the local card shop.',
      'Get promoted to shift lead.',
      'Get promoted to store manager.',
      'Buy out the card shop you work at.',
      'Grow your shop into the largest in the world.',
    ][i],
    category: 'career',
    icon: '🏪',
    check: (stats) => (stats.careerStage || 0) >= i + 1,
    progress: (stats) => (stats.careerStage || 0) >= i + 1 ? 1 : 0,
    reward: { cash: (i + 1) * 250 },
  });
});

const UPGRADE_KEYS = ['shelves', 'displays', 'storage', 'security', 'employees', 'advertising', 'website', 'shipping', 'tradeShowBooths'];
for (const key of UPGRADE_KEYS) {
  [1, 2, 3, 4, 5].forEach((lvl) => {
    achievements.push({
      id: `upgrade_${key}_${lvl}`,
      name: `${key.replace(/([A-Z])/g, ' $1')} Level ${lvl}`,
      desc: `Upgrade your store's ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} to level ${lvl}.`,
      category: 'store_upgrades',
      icon: '🔧',
      check: (stats) => (stats.storeUpgrades?.[key] || 0) >= lvl,
      progress: (stats) => Math.min(1, (stats.storeUpgrades?.[key] || 0) / lvl),
      reward: { cash: lvl * 100 },
    });
  });
}

// --- Marketplace -----------------------------------------------------------
tierAchievement({
  id: 'auctions_won',
  name: (n) => `Auction Regular ${n}`,
  desc: (n) => `Win ${n} marketplace auctions.`,
  stat: 'auctionsWon',
  tiers: [1, 10, 50, 100],
});

tierAchievement({
  id: 'trades_made',
  name: (n) => `Trader ${n}`,
  desc: (n) => `Complete ${n} trades with other collectors.`,
  stat: 'tradesMade',
  tiers: [1, 10, 50, 100],
});

export const ACHIEVEMENTS = achievements;

export function getAchievement(id) {
  return ACHIEVEMENTS.find(a => a.id === id);
}
