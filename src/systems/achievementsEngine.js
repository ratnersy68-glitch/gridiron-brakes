// Runs the achievement checklist against current stats, unlocking + paying
// out any newly-earned achievements. Call checkAchievements(state) after any
// action that could move a stat (pack opened, card sold, upgrade bought...).

import { ACHIEVEMENTS } from '../data/achievements.js';
import { addCash } from './state.js';
import { bus } from './eventBus.js';

export function checkAchievements(state) {
  const unlockedSet = new Set(state.achievementsUnlocked);
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlockedSet.has(ach.id)) continue;
    if (ach.check(state.stats)) {
      state.achievementsUnlocked.push(ach.id);
      unlockedSet.add(ach.id);
      if (ach.reward?.cash) addCash(state, ach.reward.cash, { earned: true });
      newlyUnlocked.push(ach);
    }
  }

  if (newlyUnlocked.length) {
    bus.emit('achievements-unlocked', newlyUnlocked);
  }
  return newlyUnlocked;
}

export function achievementProgress(state, ach) {
  if (state.achievementsUnlocked.includes(ach.id)) return 1;
  return ach.progress ? ach.progress(state.stats) : 0;
}
