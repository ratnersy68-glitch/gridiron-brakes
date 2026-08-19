// Challenge Mode objectives. `check(ctx)` receives the attempt result context
// and challenge progress state; returns true if the attempt satisfies a step.
// Each challenge tracks its own `progress` counter reset on entry.
export const CHALLENGES = [
  {
    id: 'top_shelf_hattrick',
    name: 'Top Shelf Hat Trick',
    desc: 'Score 3 Top Shelf goals in a row. Any miss resets your streak.',
    unlockLevel: 1,
    goalieId: 'scrambler', difficultyId: 'rookie',
    target: 3,
    progressLabel: (p, t) => `${p}/${t} in a row`,
    evaluate(result, state) {
      if (result.goal && result.zone === 'topShelf') { state.progress++; }
      else { state.progress = 0; }
      return state.progress >= state.target;
    },
    fail(result, state) { return !result.goal && state.attempts >= 8; },
  },
  {
    id: 'five_hole_specialist',
    name: 'Five Hole Specialist',
    desc: 'Beat the Butterfly Specialist five-hole 2 times in 6 attempts.',
    unlockLevel: 3,
    goalieId: 'butterfly', difficultyId: 'rookie',
    target: 2, maxAttempts: 6,
    progressLabel: (p, t) => `${p}/${t} five-holes`,
    evaluate(result, state) {
      if (result.goal && result.zone === 'fiveHole') state.progress++;
      return state.progress >= state.target;
    },
    fail(result, state) { return state.attempts >= state.maxAttempts && state.progress < state.target; },
  },
  {
    id: 'backhand_only',
    name: 'Backhand Artist',
    desc: 'Score 4 goals using only the Backhand shot.',
    unlockLevel: 5,
    goalieId: 'wall', difficultyId: 'pro',
    target: 4, maxAttempts: 8,
    progressLabel: (p, t) => `${p}/${t} backhand goals`,
    evaluate(result, state) {
      if (result.shotType === 'backhand' && result.goal) state.progress++;
      return state.progress >= state.target;
    },
    fail(result, state) { return state.attempts >= state.maxAttempts && state.progress < state.target; },
  },
  {
    id: 'lightning_release',
    name: 'Lightning Release',
    desc: 'Score within 1.2s of the puck being ready, 3 times.',
    unlockLevel: 7,
    goalieId: 'scrambler', difficultyId: 'allstar',
    target: 3, maxAttempts: 8,
    progressLabel: (p, t) => `${p}/${t} quick goals`,
    evaluate(result, state) {
      if (result.goal && result.timeToRelease <= 1.2) state.progress++;
      return state.progress >= state.target;
    },
    fail(result, state) { return state.attempts >= state.maxAttempts && state.progress < state.target; },
  },
  {
    id: 'michigan_madness',
    name: 'Michigan Madness',
    desc: 'Land 1 Michigan goal against the Wildcard.',
    unlockLevel: 9,
    goalieId: 'wildcard', difficultyId: 'elite',
    target: 1, maxAttempts: 6,
    progressLabel: (p, t) => `${p}/${t} Michigan`,
    evaluate(result, state) {
      if (result.goal && result.special === 'michigan') state.progress++;
      return state.progress >= state.target;
    },
    fail(result, state) { return state.attempts >= state.maxAttempts && state.progress < state.target; },
  },
  {
    id: 'perfect_night',
    name: 'Perfect Night',
    desc: 'Score 5 goals with zero misses against Pro difficulty.',
    unlockLevel: 11,
    goalieId: 'wall', difficultyId: 'pro',
    target: 5,
    progressLabel: (p, t) => `${p}/${t} goals, 0 misses`,
    evaluate(result, state) {
      if (result.goal) { state.progress++; } else { return 'fail'; }
      return state.progress >= state.target;
    },
    fail(result) { return !result.goal; },
  },
  {
    id: 'boss_ironcurtain',
    name: 'Break the Iron Curtain',
    desc: 'Score 2 goals against Boss goalie Iron Curtain on Elite.',
    unlockLevel: 14,
    goalieId: 'ironcurtain', difficultyId: 'elite', boss: true,
    target: 2, maxAttempts: 10,
    progressLabel: (p, t) => `${p}/${t} goals`,
    evaluate(result, state) {
      if (result.goal) state.progress++;
      return state.progress >= state.target;
    },
    fail(result, state) { return state.attempts >= state.maxAttempts && state.progress < state.target; },
  },
  {
    id: 'boss_ghost',
    name: 'Outwit The Ghost',
    desc: 'Score 3 goals against Boss goalie The Ghost on Legend.',
    unlockLevel: 20,
    goalieId: 'ghost', difficultyId: 'legend', boss: true,
    target: 3, maxAttempts: 10,
    progressLabel: (p, t) => `${p}/${t} goals`,
    evaluate(result, state) {
      if (result.goal) state.progress++;
      return state.progress >= state.target;
    },
    fail(result, state) { return state.attempts >= state.maxAttempts && state.progress < state.target; },
  },
];

export function getChallenge(id) {
  return CHALLENGES.find((c) => c.id === id);
}
