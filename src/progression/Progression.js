// XP/currency economy. Listens to gameplay events on the shared EventBus so
// it never needs to be imported by LevelRuntime directly.

import { EventBus } from '../core/Utils.js';

const DIFFICULTY_XP = { 1: 20, 2: 25, 3: 35, 4: 45, 5: 60, 6: 75, 7: 95, 8: 120, 9: 160, 10: 220 };
const DIFFICULTY_CURRENCY = { 1: 12, 2: 15, 3: 20, 4: 26, 5: 34, 6: 44, 7: 58, 8: 76, 9: 100, 10: 140 };

export function xpForNextLevel(level) { return Math.round(90 * Math.pow(level, 1.35)); }

export class Progression {
  constructor(save) {
    this.save = save;
    this._unsubs = [
      EventBus.on('level:complete', (e) => this.onLevelComplete(e)),
      EventBus.on('level:coin', (e) => this.onCoin(e)),
      EventBus.on('daily:complete', (e) => this.onDailyComplete(e)),
      EventBus.on('achievement:unlocked', (e) => this.onAchievement(e)),
    ];
  }

  addXp(amount) {
    const d = this.save.data;
    d.xp += amount;
    let leveled = false;
    while (d.xp >= xpForNextLevel(d.playerLevel)) {
      d.xp -= xpForNextLevel(d.playerLevel);
      d.playerLevel++;
      leveled = true;
    }
    if (leveled) EventBus.emit('progression:level-up', { level: d.playerLevel });
  }

  addCurrency(amount) { this.save.data.currency += amount; }

  onLevelComplete({ levelId, deaths, practiceMode, difficulty, coinsCollected, totalCoins }) {
    if (practiceMode) return;
    const prog = this.save.getLevelProgress(levelId);
    const firstClear = !prog.completed;
    let xp = DIFFICULTY_XP[difficulty] || 30;
    let cur = DIFFICULTY_CURRENCY[difficulty] || 15;
    if (deaths === 0) { xp += 15; cur += 10; }
    if (firstClear) { xp += 20; cur += 15; }
    xp += coinsCollected * 8;
    cur += coinsCollected * 6;
    this.addXp(xp);
    this.addCurrency(cur);
    this.save.save();
    EventBus.emit('progression:reward', { xp, currency: cur, levelId });
  }

  onCoin() { /* per-coin reward is folded into the level-complete payout to avoid farming by dying repeatedly */ }

  onDailyComplete() {
    this.addXp(60);
    this.addCurrency(50);
    this.save.save();
  }

  onAchievement({ reward }) {
    if (!reward) return;
    if (reward.xp) this.addXp(reward.xp);
    if (reward.currency) this.addCurrency(reward.currency);
    this.save.save();
  }
}
