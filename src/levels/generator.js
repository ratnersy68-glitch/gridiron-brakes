// Turns level metadata (levelList.js) into a fully playable level object.
// Levels 1-5 are hand-authored; everything else is composed deterministically
// from the pattern library so re-generating the same id always yields the
// same layout (needed for level select stats / best-time comparisons).

import { LevelBuilder, PATTERNS } from './patterns.js';
import * as O from '../level/Objects.js';
import { mulberry32, choice } from '../core/Utils.js';
import { getLevelMeta } from './levelList.js';
import { isAuthored, buildAuthoredLevel } from './authored.js';

const cache = new Map();

function composeLevel(meta) {
  const rng = mulberry32(meta.seed);
  const b = new LevelBuilder(500);
  const diff = meta.difficultyScale;
  let coinsPlaced = 0;
  const coinCheckpoints = [0.28, 0.55, 0.85].map((f) => Math.round(meta.patternCount * f));

  for (let i = 0; i < meta.patternCount; i++) {
    if (rng() < 0.22 + diff * 0.1) b.addPad(choice(rng, ['yellow', 'pink']), 820 + rng() * 260, 90);
    else if (rng() < 0.14) b.addRing(680 + rng() * 200, null, 90);

    const key = choice(rng, meta.styles);
    PATTERNS[key](b, rng, diff);
    b.advance(70 + rng() * 60);

    if (coinsPlaced < 3 && coinCheckpoints.includes(i)) {
      b.addCoin(130 + rng() * 90, true);
      coinsPlaced++;
    }
  }
  while (coinsPlaced < 3) {
    b.addCoin(140, true);
    b.advance(90);
    coinsPlaced++;
  }

  const endX = b.cursor + 420;
  b.finalizeGround(endX);

  return {
    id: meta.id, name: meta.name, difficulty: meta.difficulty, category: meta.category,
    musicTrack: meta.musicTrack, theme: meta.theme, length: endX, groundY: 500, killY: 900,
    startForm: 'runner',
    solids: b.solids, hazards: b.hazards, pads: b.pads, rings: b.rings, portals: b.portals, coins: b.coins,
    end: O.endFlag(endX - 100, 500),
  };
}

export function generateLevel(id) {
  if (cache.has(id)) return cloneRuntime(cache.get(id));
  const meta = getLevelMeta(id);
  if (!meta) throw new Error(`No such level: ${id}`);
  const level = isAuthored(id) ? buildAuthoredLevel(meta) : composeLevel(meta);
  cache.set(id, level);
  return cloneRuntime(level);
}

// LevelRuntime mutates object state (coin.collected, portal._armed, platform
// positions) in place, so every fresh attempt needs its own deep copy of the
// static layout while sharing the same underlying design.
function cloneRuntime(level) {
  return {
    ...level,
    solids: level.solids.map((s) => ({ ...s })),
    hazards: level.hazards.map((h) => ({ ...h })),
    pads: level.pads.map((p) => ({ ...p })),
    rings: level.rings.map((r) => ({ ...r })),
    portals: level.portals.map((p) => ({ ...p })),
    coins: level.coins.map((c) => ({ ...c })),
    end: { ...level.end },
  };
}
