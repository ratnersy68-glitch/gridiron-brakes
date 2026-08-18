// LevelBuilder: a small DSL for laying out a level left-to-right. Ground is
// assumed continuous; calling gap() carves a hole that must be jumped,
// flown over, or bridged with a platform. Patterns below are the 15
// gameplay "styles" requested for level variety — each is a reusable,
// difficulty-scaled chunk of obstacles a level composes several of.

import * as O from '../level/Objects.js';
import { clamp } from '../core/Utils.js';

export class LevelBuilder {
  constructor(groundY = 500) {
    this.groundY = groundY;
    this.cursor = 320;
    this.solids = [];
    this.hazards = [];
    this.pads = [];
    this.rings = [];
    this.portals = [];
    this.coins = [];
    this.gaps = [];
  }

  advance(w) { this.cursor += w; return this.cursor; }

  gap(width) {
    const x1 = this.cursor, x2 = this.cursor + width;
    this.gaps.push({ x1, x2 });
    this.cursor = x2;
    return { x1, x2 };
  }

  addSpike(spacingAfter = 90, opts = {}) {
    this.hazards.push(O.spike(this.cursor, this.groundY, opts));
    this.advance(spacingAfter);
  }

  addFakeSpike(spacingAfter = 90, opts = {}) {
    this.hazards.push(O.fakeSpike(this.cursor, this.groundY, opts));
    this.advance(spacingAfter);
  }

  addSaw(opts = {}, spacingAfter = 110) {
    this.hazards.push(O.saw(this.cursor, opts.y ?? this.groundY - 40, opts));
    this.advance(spacingAfter);
  }

  addSawTrack(opts = {}, spacingAfter = 150) {
    this.hazards.push(O.sawTrack(this.cursor, opts.y ?? this.groundY - 60, opts));
    this.advance(spacingAfter);
  }

  addBlock(w, h, spacingAfter = 90, yTop = null) {
    const yRef = yTop !== null ? yTop + h : this.groundY;
    this.solids.push(O.block(this.cursor, yRef, w, h));
    this.advance(spacingAfter);
  }

  addWallPair(w, floorTopY, ceilBottomY, spacingAfter = 140) {
    const floorH = Math.max(4, this.groundY - floorTopY);
    const ceilH = Math.max(4, ceilBottomY);
    this.solids.push(O.block(this.cursor, this.groundY, w, floorH));
    this.solids.push(O.block(this.cursor, ceilBottomY, w, ceilH));
    this.advance(spacingAfter);
  }

  addMovingPlatform(w, h, opts = {}, spacingAfter = 150) {
    this.solids.push(O.movingPlatform(this.cursor, this.groundY - (opts.height ?? 60), w, h, opts));
    this.advance(spacingAfter);
  }

  addDisappearingPlatform(w, h, opts = {}, spacingAfter = 130) {
    this.solids.push(O.disappearingPlatform(this.cursor, this.groundY, w, h, opts));
    this.advance(spacingAfter);
  }

  addPad(kind, power, spacingAfter = 100) {
    this.pads.push(O.pad(this.cursor, this.groundY, { kind, power }));
    this.advance(spacingAfter);
  }

  addRing(power, y, spacingAfter = 100) {
    this.rings.push(O.ring(this.cursor, y ?? this.groundY - 90, { power }));
    this.advance(spacingAfter);
  }

  addPortal(effect, label = '', spacingAfter = 60) {
    this.portals.push(O.portal(this.cursor, this.groundY - 90, 200, effect, { label }));
    this.advance(spacingAfter);
  }

  addCoin(yOffset = 140, hard = false) {
    this.coins.push(O.coin(this.cursor, this.groundY - yOffset, { hard }));
  }

  finalizeGround(endX) {
    const sorted = [...this.gaps].sort((a, b) => a.x1 - b.x1);
    let last = 0;
    const segs = [];
    for (const g of sorted) {
      if (g.x1 > last) segs.push({ x1: last, x2: g.x1 });
      last = Math.max(last, g.x2);
    }
    if (last < endX) segs.push({ x1: last, x2: endX });
    for (const s of segs) this.solids.unshift(O.ground(s.x1, s.x2 - s.x1, this.groundY));
  }
}

// --- 15 gameplay-style pattern chunks -------------------------------------

export function patternReaction(b, rng, diff) {
  const n = 3 + Math.round(diff * 3);
  for (let i = 0; i < n; i++) {
    b.gap(55 + rng() * 15);
    b.addSpike(60 - diff * 14);
  }
}

export function patternPrecision(b, rng, diff) {
  const n = 3 + Math.round(diff * 2);
  for (let i = 0; i < n; i++) {
    b.gap(70 + rng() * 12);
    b.addBlock(36, 30, 110);
  }
}

export function patternGravity(b, rng, diff) {
  b.addPortal({ gravity: -1, form: 'orb' }, 'GRAVITY');
  const n = 3 + Math.round(diff * 3);
  for (let i = 0; i < n; i++) b.addSpike(95, { ceiling: i % 2 === 0 });
  b.addPortal({ gravity: 1, form: 'runner' }, 'NORMAL');
}

export function patternReverseGravity(b, rng, diff) {
  b.addPortal({ gravity: -1 }, 'FLIP');
  const n = 3 + Math.round(diff * 2);
  for (let i = 0; i < n; i++) {
    b.addBlock(40, 34, 100, i % 2 === 0 ? 40 : null);
  }
  b.addPortal({ gravity: 1 }, 'FLIP');
}

export function patternFlight(b, rng, diff) {
  b.addPortal({ form: 'glider' }, 'FLY');
  const n = 5 + Math.round(diff * 5);
  let windowY = b.groundY - 150;
  for (let i = 0; i < n; i++) {
    windowY = clamp(windowY + (rng() - 0.5) * (70 + diff * 50), b.groundY - 260, b.groundY - 70);
    const gapH = 130 - diff * 30;
    b.addWallPair(56, windowY + gapH / 2, windowY - gapH / 2, 150 - diff * 15);
  }
  b.addPortal({ form: 'runner' }, 'LAND');
}

export function patternZigzag(b, rng, diff) {
  const n = 5 + Math.round(diff * 4);
  let high = false;
  for (let i = 0; i < n; i++) {
    b.gap(60);
    b.addBlock(40, high ? 96 : 40, 60);
    high = !high;
  }
}

export function patternMovingPlatforms(b, rng, diff) {
  const n = 3 + Math.round(diff * 2);
  const spacing = 150;
  const start = b.cursor;
  b.gap(spacing * n + 60);
  let x = start + 90;
  for (let i = 0; i < n; i++) {
    b.solids.push(O.movingPlatform(x, b.groundY - 40, 74, 20, { axis: 'y', amplitude: 40 + diff * 40, speed: 1.1 + diff * 0.6, phase: i * 1.4 }));
    x += spacing;
  }
}

export function patternDisappearing(b, rng, diff) {
  const n = 3 + Math.round(diff * 3);
  const spacing = 130;
  const start = b.cursor;
  b.gap(spacing * n + 40);
  let x = start + 80;
  for (let i = 0; i < n; i++) {
    b.solids.push(O.disappearingPlatform(x, b.groundY, 64, 20, { onTime: 1.1 - diff * 0.3, offTime: 0.6 + diff * 0.2, phase: i * 0.5 }));
    x += spacing;
  }
}

export function patternFakeObstacles(b, rng, diff) {
  const n = 3 + Math.round(diff * 2);
  for (let i = 0; i < n; i++) {
    if (rng() < 0.5) b.addFakeSpike(95);
    else b.addSpike(95);
  }
}

export function patternTimedJumps(b, rng, diff) {
  const n = 3 + Math.round(diff * 2);
  for (let i = 0; i < n; i++) {
    b.addSawTrack({ axis: 'x', amplitude: 60 + diff * 30, speed: 1.4 + diff * 0.5, phase: i, y: b.groundY - 50 }, 160);
    b.gap(70);
  }
}

export function patternSpeedChanges(b, rng, diff) {
  const speeds = [1.4, 0.75, 1.6, 1];
  for (const s of speeds) {
    b.addPortal({ speedMult: s }, s > 1 ? 'FAST' : 'SLOW');
    const n = 2 + Math.round(diff * 2);
    for (let i = 0; i < n; i++) b.addSpike(90 * (2 - s));
  }
  b.addPortal({ speedMult: 1 }, 'NORMAL');
}

export function patternPortals(b, rng, diff) {
  const forms = ['orb', 'runner', 'booster', 'runner'];
  for (const f of forms) {
    b.addPortal({ form: f, gravity: 1 }, f.toUpperCase());
    const n = 2 + Math.round(diff * 2);
    for (let i = 0; i < n; i++) {
      if (f === 'booster') b.addSpike(100);
      else b.addBlock(36, 34, 100);
    }
  }
}

export function patternBoss(b, rng, diff) {
  // A dense, telegraphed multi-hazard gauntlet that reads as a "boss room".
  b.addPortal({ speedMult: 1.15 }, 'DANGER');
  const waves = 3 + Math.round(diff * 2);
  for (let w = 0; w < waves; w++) {
    b.addSawTrack({ axis: 'y', amplitude: 70, speed: 2 + diff, phase: w, y: b.groundY - 70 }, 150);
    b.addSpike(80);
    b.addSpike(80);
    b.gap(70);
  }
  b.addPortal({ speedMult: 1 }, 'CLEAR');
}

export function patternChase(b, rng, diff) {
  // A relentless low-ceiling corridor that reads as being "chased" —
  // the shrinking headroom forces a no-stalling sprint to the exit.
  b.addPortal({ speedMult: 1.25 }, 'RUN');
  const n = 5 + Math.round(diff * 4);
  for (let i = 0; i < n; i++) {
    b.addWallPair(50, b.groundY - 40, 130 + (i % 3) * 20, 120);
  }
  b.addPortal({ speedMult: 1 }, 'SAFE');
}

export function patternRhythm(b, rng, diff) {
  const n = 6 + Math.round(diff * 4);
  for (let i = 0; i < n; i++) {
    b.addSpike(64); // evenly spaced spike train synced to the music grid
  }
}

export const PATTERNS = {
  reaction: patternReaction,
  precision: patternPrecision,
  gravity: patternGravity,
  reverseGravity: patternReverseGravity,
  flight: patternFlight,
  zigzag: patternZigzag,
  movingPlatforms: patternMovingPlatforms,
  disappearing: patternDisappearing,
  fake: patternFakeObstacles,
  timedJumps: patternTimedJumps,
  speedChanges: patternSpeedChanges,
  portals: patternPortals,
  boss: patternBoss,
  chase: patternChase,
  rhythm: patternRhythm,
};
