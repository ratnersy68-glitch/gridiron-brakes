import { ARENAS } from '../data/arenas.js';
import { getItem } from '../data/cosmetics.js';
import { getDifficulty, DIFFICULTIES } from '../data/difficulty.js';

const SPECIAL_XP_BONUS = {
  topShelf: 25, fiveHole: 30, postAndIn: 45, michigan: 90,
  backhandDeke: 20, spinMove: 15, oneTimer: 15, powerShot: 15,
};

export function xpForLevel(level) {
  return Math.round(120 + (level - 1) * 55 + Math.pow(level - 1, 1.6) * 6);
}

export function computeLevelFromTotalXP(totalXp) {
  let level = 1, remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
    if (level > 200) break;
  }
  return { level, xpIntoLevel: remaining, xpForNext: xpForLevel(level) };
}

export function rankName(level) {
  const idx = Math.min(DIFFICULTIES.length - 1, Math.floor((level - 1) / 4));
  return DIFFICULTIES[idx].name;
}

export function awardForAttempt(result, difficultyId) {
  const diff = getDifficulty(difficultyId);
  let xp = 6; // participation
  let coins = 3;
  if (result.goal) {
    xp += 35;
    coins += 18;
    if (result.zone) xp += { topShelf: 10, fiveHole: 12, upstairs: 4 }[result.zone] || 0;
    if (result.special && SPECIAL_XP_BONUS[result.special]) {
      xp += SPECIAL_XP_BONUS[result.special];
      coins += Math.round(SPECIAL_XP_BONUS[result.special] * 0.6);
    }
    if (result.quality > 0.85) { xp += 8; coins += 4; }
  } else {
    xp += 4;
  }
  xp = Math.round(xp * diff.xpMultiplier);
  coins = Math.round(coins * diff.coinMultiplier);
  return { xp, coins };
}

// Mutates `profile` with the results of one resolved attempt: XP, coins,
// level, career stats, and leaderboard-relevant bests. Returns a summary
// for the UI (amounts awarded, level-up, newly unlocked arenas).
export function applyAttemptToProfile(profile, result, difficultyId, elapsedSincePuckReady) {
  const before = computeLevelFromTotalXP(profile.xp);
  const award = awardForAttempt(result, difficultyId);
  profile.xp += award.xp;
  profile.coins += award.coins;
  const after = computeLevelFromTotalXP(profile.xp);
  profile.level = after.level;

  const s = profile.stats;
  s.totalAttempts++;
  if (result.goal) {
    s.totalGoals++;
    s.currentStreak++;
    s.longestStreak = Math.max(s.longestStreak, s.currentStreak);
    const diffOrder = getDifficulty(difficultyId).order;
    if (s.hardestGoalieBeaten === null || diffOrder > s.hardestGoalieBeaten) s.hardestGoalieBeaten = diffOrder;
    if (typeof elapsedSincePuckReady === 'number') {
      if (s.fastestGoal === null || elapsedSincePuckReady < s.fastestGoal) s.fastestGoal = elapsedSincePuckReady;
    }
  } else {
    s.totalMisses++;
    s.currentStreak = 0;
  }
  s.shootingPct = s.totalAttempts > 0 ? Math.round((s.totalGoals / s.totalAttempts) * 1000) / 10 : 0;
  s.highScore = Math.max(s.highScore, s.totalGoals);

  const newlyUnlockedArenas = [];
  for (const arena of ARENAS) {
    if (after.level >= arena.unlockLevel && !profile.unlockedArenas.includes(arena.id)) {
      profile.unlockedArenas.push(arena.id);
      newlyUnlockedArenas.push(arena);
    }
  }

  return { ...award, leveledUp: after.level > before.level, newLevel: after.level, newlyUnlockedArenas };
}

export function recordChallengeComplete(profile, challengeId) {
  if (!profile.stats.challengesCompleted.includes(challengeId)) {
    profile.stats.challengesCompleted.push(challengeId);
  }
}

export function recordBossBeaten(profile, goalieId) {
  if (!profile.stats.bossesBeaten.includes(goalieId)) {
    profile.stats.bossesBeaten.push(goalieId);
  }
}

export function canAfford(profile, category, itemId) {
  const item = getItem(category, itemId);
  if (!item) return false;
  if (profile.level < item.unlockLevel) return false;
  if ((profile.ownedItems[category] || []).includes(itemId)) return true;
  return profile.coins >= item.cost;
}

export function purchaseItem(profile, category, itemId) {
  const item = getItem(category, itemId);
  if (!item) return { ok: false, reason: 'unknown item' };
  const owned = profile.ownedItems[category] || (profile.ownedItems[category] = []);
  if (owned.includes(itemId)) return { ok: true, alreadyOwned: true };
  if (profile.level < item.unlockLevel) return { ok: false, reason: `Requires level ${item.unlockLevel}` };
  if (profile.coins < item.cost) return { ok: false, reason: 'Not enough coins' };
  profile.coins -= item.cost;
  owned.push(itemId);
  return { ok: true };
}

export function equipItem(profile, category, itemId) {
  if (!(profile.ownedItems[category] || []).includes(itemId)) return false;
  profile.loadout[category] = itemId;
  return true;
}
