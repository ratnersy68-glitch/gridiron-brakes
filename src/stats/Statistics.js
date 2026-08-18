// Passive listener that keeps save.data.stats up to date from gameplay
// events. Nothing here computes rewards — that's Progression's job.

import { EventBus } from '../core/Utils.js';
import { getLevelMeta } from '../levels/levelList.js';

const CATEGORY_RANK = { Easy: 1, Normal: 2, Hard: 3, Insane: 4, Demon: 5 };

export class Statistics {
  constructor(save) {
    this.save = save;
    this._playtimeAccum = 0;
    this._unsubs = [
      EventBus.on('level:attempt-start', () => this._bump('totalAttempts')),
      EventBus.on('level:death', () => this._bump('totalDeaths')),
      EventBus.on('level:jump', () => this._bump('totalJumps')),
      EventBus.on('level:coin', () => this._bump('coinsCollected')),
      EventBus.on('level:complete', (e) => this._onComplete(e)),
      EventBus.on('practice:session', () => this._bump('practiceSessions')),
    ];
  }

  _bump(key, by = 1) { this.save.data.stats[key] = (this.save.data.stats[key] || 0) + by; this.save.save(); }

  tick(dt, distanceThisFrame) {
    this._playtimeAccum += dt;
    this.save.data.stats.totalDistance += distanceThisFrame;
    if (this._playtimeAccum > 1) {
      this.save.data.stats.totalPlaytimeMs += Math.floor(this._playtimeAccum * 1000);
      this._playtimeAccum = 0;
      this.save.save();
    }
  }

  _onComplete({ levelId, practiceMode }) {
    if (practiceMode) return;
    const s = this.save.data.stats;
    s.levelsCompleted++;
    const meta = getLevelMeta(levelId);
    if (meta) {
      const rank = CATEGORY_RANK[meta.category];
      const curRank = s.hardestLevelCompleted ? CATEGORY_RANK[getLevelMeta(s.hardestLevelCompleted)?.category] || 0 : 0;
      if (rank > curRank || (rank === curRank && meta.difficulty > (getLevelMeta(s.hardestLevelCompleted)?.difficulty || 0))) {
        s.hardestLevelCompleted = levelId;
      }
      if (!s.bestLevelId) s.bestLevelId = levelId;
    }
    this.save.save();
  }
}
