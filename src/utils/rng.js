// Deterministic PRNG (mulberry32) so generated content (players, base odds
// rolls used for seeding) stays stable across reloads unless explicitly
// re-seeded. Gameplay RNG (pack odds, market drift) uses Math.random()
// directly via rollFloat() — only world-generation uses seeded streams.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function pickWeighted(rng, entries) {
  // entries: [{ value, weight }]
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = rng() * total;
  for (const e of entries) {
    if (roll < e.weight) return e.value;
    roll -= e.weight;
  }
  return entries[entries.length - 1].value;
}

export function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
