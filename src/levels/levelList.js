// Metadata for all 50 levels. Each entry drives both the procedural
// generator (styles/difficultyScale) and the UI (name/category/theme/music).
// Levels 1-5 are hand-authored (see authored.js); 6-50 are composed from the
// pattern library in patterns.js, so every level still gets a unique,
// deterministic layout, palette and soundtrack seed.

import { mulberry32, hashStringToSeed, pick, themeFromHue } from '../core/Utils.js';
import { TRACKS } from '../audio/AudioEngine.js';

const NAMES = [
  'First Steps', 'Double Take', 'Ring Test', 'Flip Side', 'Takeoff',
  'Neon Alley', 'Block Party', 'Skyline Dash', 'Gapminder', 'Easy Street Ends',
  'Circuit Drift', 'Static Bloom', 'Afterglow', 'Vertigo Line', 'Echo Chamber',
  'Pulse Width', 'Fracture Point', 'Glass Ceiling', 'Loop Back', 'Overclock',
  'Ion Trail', 'Split Signal', 'Hollow Grid', 'Wrong Turn', 'Freefall Protocol',
  'Cascade Fault', 'Night Cycle', 'Prism Break', 'Recoil', 'Last Light',
  'Voltage Spike', 'Blackout Run', 'Severance', 'Warp Static', 'Ashen Circuit',
  'Null Gravity', 'Fever Dream', 'Wire Storm', 'Collapse Theory', 'The Undertow',
  'Emberfall', 'Corrosion', 'Deadlock', 'Vantablack', 'Paradox Loop',
  'The Reckoning', 'Hollow King', 'Requiem Line', 'Singularity', 'Apex Demon',
];

const CATEGORY_DEFS = [
  { key: 'Easy', start: 1, end: 10, diff: [0.04, 0.28], stars: [1, 2], styleCount: 3,
    pool: ['reaction', 'precision', 'zigzag', 'fake', 'timedJumps'] },
  { key: 'Normal', start: 11, end: 20, diff: [0.30, 0.48], stars: [3, 4], styleCount: 4,
    pool: ['reaction', 'precision', 'zigzag', 'fake', 'timedJumps', 'movingPlatforms', 'disappearing', 'portals', 'gravity'] },
  { key: 'Hard', start: 21, end: 30, diff: [0.50, 0.68], stars: [5, 6], styleCount: 5,
    pool: ['reaction', 'precision', 'zigzag', 'movingPlatforms', 'disappearing', 'portals', 'gravity', 'reverseGravity', 'flight', 'speedChanges'] },
  { key: 'Insane', start: 31, end: 40, diff: [0.70, 0.86], stars: [7, 8], styleCount: 6,
    pool: ['reaction', 'precision', 'zigzag', 'movingPlatforms', 'disappearing', 'portals', 'gravity', 'reverseGravity', 'flight', 'speedChanges', 'rhythm', 'boss', 'fake', 'timedJumps'] },
  { key: 'Demon', start: 41, end: 50, diff: [0.88, 1.0], stars: [9, 10], styleCount: 7,
    pool: ['reaction', 'precision', 'zigzag', 'movingPlatforms', 'disappearing', 'portals', 'gravity', 'reverseGravity', 'flight', 'speedChanges', 'rhythm', 'boss', 'chase', 'fake', 'timedJumps'] },
];

const TRACK_KEYS = Object.keys(TRACKS);

function lerp(a, b, t) { return a + (b - a) * t; }

export const LEVEL_META = [];

for (const cat of CATEGORY_DEFS) {
  const count = cat.end - cat.start + 1;
  for (let i = 0; i < count; i++) {
    const id = cat.start + i;
    const t = count > 1 ? i / (count - 1) : 0;
    const name = NAMES[id - 1];
    const seed = hashStringToSeed(`${id}:${name}`);
    const rng = mulberry32(seed);
    const difficultyScale = lerp(cat.diff[0], cat.diff[1], t);
    const stars = Math.round(lerp(cat.stars[0], cat.stars[1], t));
    const styles = pick(rng, cat.pool, Math.min(cat.styleCount, cat.pool.length));
    const musicTrack = TRACK_KEYS[id % TRACK_KEYS.length];
    const hue = Math.floor(rng() * 360);
    LEVEL_META.push({
      id, name, category: cat.key, difficulty: stars, difficultyScale,
      styles, musicTrack, theme: themeFromHue(hue, name), seed,
      patternCount: 5 + Math.round(difficultyScale * 11),
    });
  }
}

export function getLevelMeta(id) { return LEVEL_META.find((l) => l.id === id); }
export function getLevelsByCategory(cat) { return LEVEL_META.filter((l) => l.category === cat); }
export const CATEGORIES = CATEGORY_DEFS.map((c) => c.key);
