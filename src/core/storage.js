import { defaultLoadout } from '../data/cosmetics.js';

const KEY = 'gridiron_brakes_save_v1';

function defaultProfile() {
  return {
    xp: 0,
    level: 1,
    coins: 300,
    loadout: defaultLoadout(),
    ownedItems: {
      stick: ['stick_basic'], gloves: ['gloves_basic'], skates: ['skates_basic'],
      jersey: ['jersey_home'], pants: ['pants_basic'], celebration: ['cel_fistpump'],
      goalieMask: ['mask_basic'], trail: ['trail_basic'],
    },
    settings: {
      masterVolume: 0.8, sfxVolume: 1, musicVolume: 0.5,
      difficulty: 'rookie', quality: 'high', invertY: false, camShake: true,
    },
    stats: {
      totalAttempts: 0, totalGoals: 0, totalMisses: 0,
      highScore: 0, longestStreak: 0, currentStreak: 0,
      fastestGoal: null, hardestGoalieBeaten: null,
      shootingPct: 0,
      challengesCompleted: [],
      bossesBeaten: [],
    },
    unlockedArenas: ['localrink'],
    lastArena: 'localrink',
  };
}

let cache = null;

export function loadProfile() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      cache = mergeDefaults(defaultProfile(), parsed);
      return cache;
    }
  } catch (e) {
    console.warn('Save load failed, using defaults', e);
  }
  cache = defaultProfile();
  return cache;
}

function mergeDefaults(def, saved) {
  const out = { ...def, ...saved };
  out.loadout = { ...def.loadout, ...(saved.loadout || {}) };
  out.ownedItems = { ...def.ownedItems, ...(saved.ownedItems || {}) };
  out.settings = { ...def.settings, ...(saved.settings || {}) };
  out.stats = { ...def.stats, ...(saved.stats || {}) };
  out.unlockedArenas = saved.unlockedArenas || def.unlockedArenas;
  return out;
}

export function saveProfile(profile) {
  cache = profile;
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Save failed', e);
  }
}

export function resetProfile() {
  cache = defaultProfile();
  saveProfile(cache);
  return cache;
}
