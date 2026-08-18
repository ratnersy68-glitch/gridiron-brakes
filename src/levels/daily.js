// The Daily Challenge is a freshly composed level, deterministic per
// calendar date (UTC) so every player sees the same layout on a given day.

import { LevelBuilder, PATTERNS } from './patterns.js';
import * as O from '../level/Objects.js';
import { mulberry32, hashStringToSeed, choice, themeFromHue } from '../core/Utils.js';
import { TRACKS } from '../audio/AudioEngine.js';

const ALL_STYLES = Object.keys(PATTERNS);
const TRACK_KEYS = Object.keys(TRACKS);

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getDailyLevel(dateKey = todayKey()) {
  const seed = hashStringToSeed(`daily:${dateKey}`);
  const rng = mulberry32(seed);
  const difficultyScale = 0.35 + rng() * 0.4;
  const patternCount = 6 + Math.round(difficultyScale * 8);
  const styles = [];
  for (let i = 0; i < 5; i++) styles.push(choice(rng, ALL_STYLES));

  const b = new LevelBuilder(500);
  let coinsPlaced = 0;
  const checkpoints = [0.3, 0.6, 0.9].map((f) => Math.round(patternCount * f));
  for (let i = 0; i < patternCount; i++) {
    if (rng() < 0.25) b.addPad(choice(rng, ['yellow', 'pink']), 850, 90);
    PATTERNS[choice(rng, styles)](b, rng, difficultyScale);
    b.advance(70 + rng() * 50);
    if (coinsPlaced < 3 && checkpoints.includes(i)) { b.addCoin(140, true); coinsPlaced++; }
  }
  while (coinsPlaced < 3) { b.addCoin(140, true); b.advance(90); coinsPlaced++; }

  const endX = b.cursor + 420;
  b.finalizeGround(endX);
  const hue = Math.floor(rng() * 360);

  return {
    id: 'daily', name: `Daily Run — ${dateKey}`, difficulty: Math.round(3 + difficultyScale * 6), category: 'Daily',
    musicTrack: TRACK_KEYS[seed % TRACK_KEYS.length], theme: themeFromHue(hue, dateKey),
    length: endX, groundY: 500, killY: 900, startForm: 'runner',
    solids: b.solids, hazards: b.hazards, pads: b.pads, rings: b.rings, portals: b.portals, coins: b.coins,
    end: O.endFlag(endX - 100, 500),
  };
}
