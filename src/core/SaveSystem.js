// Centralised save/load for all player progress. Everything lives under one
// localStorage key so we can version and migrate the shape in one place.

const SAVE_KEY = 'prismrush.save.v1';
const SAVE_VERSION = 1;

function defaultSave() {
  return {
    version: SAVE_VERSION,
    currency: 150,
    xp: 0,
    playerLevel: 1,
    unlockedShapes: ['classic'],
    unlockedTrails: ['none'],
    unlockedColors: ['neon-cyan'],
    unlockedDeathEffects: ['spark'],
    unlockedIcons: ['default'],
    unlockedBgEffects: ['none'],
    equipped: { shape: 'classic', trail: 'none', color: 'neon-cyan', deathEffect: 'spark', icon: 'default', bgEffect: 'none' },
    levels: {}, // id -> { bestPercent, completed, coins:[false,false,false], attempts, bestTimeMs, deaths }
    achievements: {}, // id -> { unlocked, unlockedAt }
    stats: {
      totalAttempts: 0, totalDeaths: 0, levelsCompleted: 0, coinsCollected: 0,
      totalPlaytimeMs: 0, bestLevelId: null, hardestLevelCompleted: null,
      totalJumps: 0, totalDistance: 0, practiceSessions: 0,
    },
    settings: {
      musicVolume: 0.7, sfxVolume: 0.8, graphicsQuality: 'high',
      screenShake: true, particles: true, fullscreen: false,
      keybinds: { jump: 'Space', pause: 'Escape', altJump: 'ArrowUp' },
      colorblindMode: false, reduceFlash: false, uiScale: 1,
    },
    dailyChallenge: { lastSeed: null, lastCompletedDate: null, streak: 0 },
    editorLevels: [], // user-created level data blobs
    createdAt: Date.now(),
  };
}

function migrate(data) {
  const base = defaultSave();
  return deepMerge(base, data || {});
}

function deepMerge(base, override) {
  if (Array.isArray(base)) return override !== undefined ? override : base;
  if (typeof base === 'object' && base !== null) {
    const out = { ...base };
    for (const k of Object.keys(override || {})) {
      out[k] = typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k])
        ? deepMerge(base[k], override[k])
        : override[k];
    }
    return out;
  }
  return override !== undefined ? override : base;
}

export class SaveSystem {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      return migrate(JSON.parse(raw));
    } catch (e) {
      console.warn('Save corrupted, resetting.', e);
      return defaultSave();
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to persist save', e);
    }
  }

  reset() {
    this.data = defaultSave();
    this.save();
  }

  getLevelProgress(levelId) {
    if (!this.data.levels[levelId]) {
      this.data.levels[levelId] = { bestPercent: 0, completed: false, coins: [false, false, false], attempts: 0, bestTimeMs: null, deaths: 0 };
    }
    return this.data.levels[levelId];
  }
}
