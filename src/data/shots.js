// Shot type tuning. windup = charge-to-fire delay feel, speedMult affects
// puck travel time (harder for goalie to react late), spread = base accuracy
// cone before player skill/timing is applied.
export const SHOT_TYPES = {
  wrist: {
    id: 'wrist', name: 'Wrist Shot', key: '1',
    speedMult: 1.0, spread: 0.05, chargeTime: 0.55, releaseTellTime: 0.18,
    desc: 'Quick, accurate, moderate power.',
  },
  slap: {
    id: 'slap', name: 'Slap Shot', key: '2',
    speedMult: 1.45, spread: 0.11, chargeTime: 0.95, releaseTellTime: 0.4,
    desc: 'Big windup, huge power, easier to read.',
  },
  snap: {
    id: 'snap', name: 'Snap Shot', key: '3',
    speedMult: 1.15, spread: 0.07, chargeTime: 0.35, releaseTellTime: 0.1,
    desc: 'Fast release, hard for the goalie to react.',
  },
  backhand: {
    id: 'backhand', name: 'Backhand', key: '4',
    speedMult: 0.85, spread: 0.09, chargeTime: 0.5, releaseTellTime: 0.15,
    desc: 'Deceptive angle, weaker power, great on the deke.',
  },
};

export const SHOT_ORDER = ['wrist', 'slap', 'snap', 'backhand'];

// Net-relative target zones used to classify "special shots" for scoring/XP.
// Net local coords: x in [-1,1] (glove/blocker side), y in [0,1] (bottom/top).
export function classifyZone(x, y) {
  if (y > 0.78 && Math.abs(x) > 0.45) return 'topShelf';
  if (y < 0.16 && Math.abs(x) < 0.22) return 'fiveHole';
  if (y > 0.78) return 'upstairs';
  if (Math.abs(x) > 0.78) return 'postSide';
  return 'body';
}
