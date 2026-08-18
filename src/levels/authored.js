// Levels 1-5 are hand-authored so the very first minutes of the game teach
// jump timing, gaps, jump rings, gravity flips and flight purely through
// level design — no tutorial popups or text boxes.

import { LevelBuilder } from './patterns.js';
import * as O from '../level/Objects.js';

function build(meta, fn) {
  const b = new LevelBuilder(500);
  fn(b);
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

const AUTHORED_BUILDERS = {
  1(meta) {
    // Teaches: jump over a single spike, then a gap.
    return build(meta, (b) => {
      b.advance(120);
      b.addSpike(160);
      b.addCoin(130, false);
      b.advance(100);
      b.gap(90);
      b.advance(140);
      b.addSpike(140);
      b.gap(100);
      b.addCoin(150, true);
      b.advance(160);
    });
  },
  2(meta) {
    // Teaches: back-to-back spikes need a bigger jump; jump pads launch you higher.
    return build(meta, (b) => {
      b.advance(100);
      b.addSpike(60); b.addSpike(140);
      b.addCoin(130, false);
      b.gap(110);
      b.advance(120);
      b.addBlock(40, 40, 130);
      b.addPad('yellow', 900, 140);
      b.addSpike(90); b.addSpike(90); b.addSpike(140);
      b.addCoin(160, true);
      b.advance(160);
    });
  },
  3(meta) {
    // Teaches: jump rings need a tap while overlapping them, and small saws.
    return build(meta, (b) => {
      b.advance(120);
      b.addRing(700, 420, 160);
      b.addCoin(150, false);
      b.gap(120);
      b.advance(120);
      b.addSaw({ y: 460 }, 150);
      b.addRing(760, 400, 150);
      b.gap(130);
      b.addCoin(160, true);
      b.advance(160);
    });
  },
  4(meta) {
    // Teaches: gravity portals flip you to the ceiling in orb form.
    return build(meta, (b) => {
      b.advance(120);
      b.addSpike(150);
      b.addPortal({ gravity: -1, form: 'orb' }, 'GRAVITY');
      b.addSpike(110);
      b.addCoin(460, false);
      b.addSpike(140);
      b.addPortal({ gravity: 1, form: 'runner' }, 'NORMAL');
      b.gap(100);
      b.addCoin(160, true);
      b.advance(160);
    });
  },
  5(meta) {
    // Teaches: glider form flies freely — hold to rise, release to fall.
    return build(meta, (b) => {
      b.advance(120);
      b.addSpike(150);
      b.addPortal({ form: 'glider' }, 'FLY');
      b.addWallPair(50, 400, 120, 160);
      b.addCoin(240, false);
      b.addWallPair(50, 440, 160, 160);
      b.addWallPair(50, 380, 100, 160);
      b.addPortal({ form: 'runner' }, 'LAND');
      b.gap(90);
      b.addCoin(150, true);
      b.advance(160);
    });
  },
};

export function isAuthored(id) { return !!AUTHORED_BUILDERS[id]; }
export function buildAuthoredLevel(meta) { return AUTHORED_BUILDERS[meta.id](meta); }
