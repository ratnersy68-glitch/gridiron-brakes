import { EventBus } from '../core/Utils.js';
import { getLevelsByCategory } from '../levels/levelList.js';

function categoryCleared(save, cat) {
  const ids = getLevelsByCategory(cat).map((l) => l.id);
  return ids.length > 0 && ids.every((id) => save.data.levels[id]?.completed);
}
function categoryAny(save, cat) {
  const ids = getLevelsByCategory(cat).map((l) => l.id);
  return ids.some((id) => save.data.levels[id]?.completed);
}
function totalUnlocks(save) {
  const d = save.data;
  return d.unlockedShapes.length + d.unlockedTrails.length + d.unlockedColors.length
    + d.unlockedDeathEffects.length + d.unlockedIcons.length + d.unlockedBgEffects.length;
}
function fullCoinLevelCount(save) {
  return Object.values(save.data.levels).filter((l) => l.coins.every(Boolean)).length;
}

export const ACHIEVEMENT_LIST = [
  { id: 'first_clear', name: 'First Clear', desc: 'Complete your first level.', reward: { xp: 30, currency: 20 }, test: (s) => s.stats.levelsCompleted >= 1 },
  { id: 'ten_levels', name: 'Getting Good', desc: 'Complete 10 levels.', reward: { xp: 60, currency: 40 }, test: (s) => s.stats.levelsCompleted >= 10 },
  { id: 'twentyfive_levels', name: 'Seasoned Runner', desc: 'Complete 25 levels.', reward: { xp: 100, currency: 70 }, test: (s) => s.stats.levelsCompleted >= 25 },
  { id: 'all_levels', name: 'Completionist', desc: 'Complete all 50 levels.', reward: { xp: 400, currency: 300 }, test: (s) => s.stats.levelsCompleted >= 50 },
  { id: 'coins_25', name: 'Coin Collector', desc: 'Collect 25 coins.', reward: { xp: 50, currency: 30 }, test: (s) => s.stats.coinsCollected >= 25 },
  { id: 'coins_75', name: 'Coin Hoarder', desc: 'Collect 75 coins.', reward: { xp: 90, currency: 60 }, test: (s) => s.stats.coinsCollected >= 75 },
  { id: 'coins_150', name: 'Coin Master', desc: 'Collect 150 coins in total.', reward: { xp: 150, currency: 110 }, test: (s) => s.stats.coinsCollected >= 150 },
  { id: 'die_100', name: 'Glutton For Punishment', desc: 'Die 100 times.', reward: { xp: 40, currency: 25 }, test: (s) => s.stats.totalDeaths >= 100 },
  { id: 'die_500', name: 'Unbreakable Will', desc: 'Die 500 times.', reward: { xp: 120, currency: 90 }, test: (s) => s.stats.totalDeaths >= 500 },
  { id: 'jumps_1000', name: 'Spring Loaded', desc: 'Jump 1,000 times.', reward: { xp: 60, currency: 35 }, test: (s) => s.stats.totalJumps >= 1000 },
  { id: 'distance_10k', name: 'Long Haul', desc: 'Travel 10,000 units.', reward: { xp: 60, currency: 35 }, test: (s) => s.stats.totalDistance >= 10000 },
  { id: 'distance_100k', name: 'Marathoner', desc: 'Travel 100,000 units.', reward: { xp: 150, currency: 100 }, test: (s) => s.stats.totalDistance >= 100000 },
  { id: 'easy_all', name: 'Easy Does It', desc: 'Complete all Easy levels.', reward: { xp: 80, currency: 50 }, testSave: (s) => categoryCleared(s, 'Easy') },
  { id: 'normal_all', name: 'Normal Order', desc: 'Complete all Normal levels.', reward: { xp: 100, currency: 70 }, testSave: (s) => categoryCleared(s, 'Normal') },
  { id: 'hard_all', name: 'Hardened', desc: 'Complete all Hard levels.', reward: { xp: 130, currency: 90 }, testSave: (s) => categoryCleared(s, 'Hard') },
  { id: 'insane_first', name: 'Insane Debut', desc: 'Complete an Insane level.', reward: { xp: 100, currency: 70 }, testSave: (s) => categoryAny(s, 'Insane') },
  { id: 'insane_all', name: 'Insanity Cleared', desc: 'Complete all Insane levels.', reward: { xp: 180, currency: 130 }, testSave: (s) => categoryCleared(s, 'Insane') },
  { id: 'demon_first', name: 'Demon Slayer', desc: 'Complete a Demon level.', reward: { xp: 220, currency: 160 }, testSave: (s) => categoryAny(s, 'Demon') },
  { id: 'demon_all', name: 'Apex Predator', desc: 'Complete every Demon level.', reward: { xp: 400, currency: 300 }, testSave: (s) => categoryCleared(s, 'Demon') },
  { id: 'no_death_clear', name: 'Flawless', desc: 'Complete a level without dying once.', reward: { xp: 60, currency: 40 }, event: 'level:complete', onEvent: (p) => p.deaths === 0 && !p.practiceMode },
  { id: 'all_coins_level', name: 'Perfectionist', desc: 'Collect all 3 coins in a single run.', reward: { xp: 50, currency: 35 }, event: 'level:complete', onEvent: (p) => p.totalCoins > 0 && p.coinsCollected === p.totalCoins },
  { id: 'all_coins_10', name: 'Coin Purist', desc: 'Fully coin 10 different levels.', reward: { xp: 120, currency: 90 }, testSave: (s) => fullCoinLevelCount(s) >= 10 },
  { id: 'practice_clear', name: 'Study Session', desc: 'Beat a level in Practice Mode.', reward: { xp: 30, currency: 15 }, event: 'level:complete', onEvent: (p) => p.practiceMode },
  { id: 'daily_first', name: 'Creature Of Habit', desc: 'Complete your first Daily Challenge.', reward: { xp: 40, currency: 30 }, event: 'daily:complete', onEvent: () => true },
  { id: 'daily_streak_7', name: 'Weekly Warrior', desc: 'Reach a 7-day Daily Challenge streak.', reward: { xp: 150, currency: 120 }, testSave: (s) => s.dailyChallenge.streak >= 7 },
  { id: 'shop_first', name: 'New Look', desc: 'Unlock a cosmetic item from the Shop.', reward: { xp: 20, currency: 10 }, testSave: (s) => totalUnlocks(s) > 6 },
  { id: 'shop_collector', name: 'Style Icon', desc: 'Unlock 15 cosmetic items.', reward: { xp: 100, currency: 0 }, testSave: (s) => totalUnlocks(s) >= 21 },
  { id: 'level10_reach', name: 'Rising Star', desc: 'Reach player level 10.', reward: { xp: 0, currency: 80 }, testSave: (s) => s.playerLevel >= 10 },
  { id: 'level25_reach', name: 'Veteran', desc: 'Reach player level 25.', reward: { xp: 0, currency: 200 }, testSave: (s) => s.playerLevel >= 25 },
  { id: 'editor_first', name: 'Level Designer', desc: 'Save a level in the Editor.', reward: { xp: 50, currency: 40 }, testSave: (s) => s.editorLevels.length >= 1 },
  { id: 'first_checkpoint', name: 'Safety Net', desc: 'Place a checkpoint in Practice Mode.', reward: { xp: 10, currency: 10 }, event: 'practice:checkpoint-added', onEvent: () => true },
  { id: 'attempts_100', name: 'Persistent', desc: 'Reach 100 total attempts.', reward: { xp: 40, currency: 25 }, testSave: (s) => s.stats.totalAttempts >= 100 },
  { id: 'attempts_1000', name: 'Never Give Up', desc: 'Reach 1,000 total attempts.', reward: { xp: 150, currency: 100 }, testSave: (s) => s.stats.totalAttempts >= 1000 },
];

const RECHECK_EVENTS = [
  'level:complete', 'level:death', 'level:coin', 'level:jump', 'progression:level-up',
  'daily:complete', 'practice:checkpoint-added', 'editor:save', 'shop:purchase',
];

export class Achievements {
  constructor(save) {
    this.save = save;
    this._unsubs = [];
    for (const ev of RECHECK_EVENTS) this._unsubs.push(EventBus.on(ev, () => this.recheckAll()));
    for (const a of ACHIEVEMENT_LIST) {
      if (a.event) this._unsubs.push(EventBus.on(a.event, (p) => this._tryUnlock(a, () => a.onEvent(p))));
    }
    this.recheckAll();
  }

  recheckAll() {
    for (const a of ACHIEVEMENT_LIST) {
      if (a.testSave) this._tryUnlock(a, () => a.testSave(this.save.data));
      else if (a.test) this._tryUnlock(a, () => a.test(this.save.data.stats));
    }
  }

  _tryUnlock(a, predicate) {
    if (this.save.data.achievements[a.id]?.unlocked) return;
    let pass = false;
    try { pass = !!predicate(); } catch { pass = false; }
    if (!pass) return;
    this.save.data.achievements[a.id] = { unlocked: true, unlockedAt: Date.now() };
    this.save.save();
    EventBus.emit('achievement:unlocked', { id: a.id, name: a.name, reward: a.reward });
  }

  get unlockedCount() { return ACHIEVEMENT_LIST.filter((a) => this.save.data.achievements[a.id]?.unlocked).length; }
}
