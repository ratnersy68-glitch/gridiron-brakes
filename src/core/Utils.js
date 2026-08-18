// Shared math/RNG helpers used across the game.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
export function randRange(rng, min, max) { return min + rng() * (max - min); }
export function randInt(rng, min, max) { return Math.floor(randRange(rng, min, max + 1)); }
export function choice(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
export function pick(rng, arr, n) {
  const pool = arr.slice();
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

// Simple HSL-based palette generator so every level gets a distinct original theme.
export function themeFromHue(hue, name) {
  return {
    name,
    hue,
    bg1: `hsl(${hue} 70% 8%)`,
    bg2: `hsl(${(hue + 40) % 360} 65% 14%)`,
    accent: `hsl(${hue} 90% 60%)`,
    accent2: `hsl(${(hue + 160) % 360} 90% 62%)`,
    player: `hsl(${(hue + 300) % 360} 95% 65%)`,
    ground: `hsl(${hue} 60% 20%)`,
    hazard: `hsl(${(hue + 200) % 360} 90% 55%)`,
  };
}

export const EventBus = {
  _listeners: new Map(),
  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return () => this._listeners.get(event)?.delete(fn);
  },
  off(event, fn) { this._listeners.get(event)?.delete(fn); },
  emit(event, payload) {
    this._listeners.get(event)?.forEach((fn) => fn(payload));
  },
};
