// Difficulty tuning. The goalie's SKATE SPEED barely changes across tiers —
// what changes is how well it reads the shooter and how late it can still
// react. Higher tiers force better timing/aim from the player, not a faster
// reflex test.
export const DIFFICULTIES = [
  {
    id: 'easy',
    name: 'Easy',
    order: 0,
    goalieMoveSpeed: 5.2,
    // How early (seconds before release) the AI locks its guess in.
    // Bigger number = commits earlier = easier to fool with a late change.
    commitLeadTime: 0.62,
    // 0..1 how accurately the AI reads your true aim vs guessing.
    readAccuracy: 0.35,
    // Chance the AI fully bites on a deke fake.
    fakeBiteChance: 0.75,
    // How wide the "perfect release" timing window is, in seconds.
    perfectWindow: 0.5,
    // Multiplier applied to the player's aim error (shakiness). Lower = more forgiving.
    aimForgiveness: 1.6,
    coverageRadius: 0.62, // fraction of net the goalie can plausibly cover once committed
    reboundSaveChance: 0.15,
    xpMultiplier: 1,
    coinMultiplier: 1,
  },
  {
    id: 'rookie',
    name: 'Rookie',
    order: 1,
    goalieMoveSpeed: 5.6,
    commitLeadTime: 0.5,
    readAccuracy: 0.48,
    fakeBiteChance: 0.62,
    perfectWindow: 0.4,
    aimForgiveness: 1.35,
    coverageRadius: 0.68,
    reboundSaveChance: 0.22,
    xpMultiplier: 1.15,
    coinMultiplier: 1.15,
  },
  {
    id: 'pro',
    name: 'Pro',
    order: 2,
    goalieMoveSpeed: 6.0,
    commitLeadTime: 0.38,
    readAccuracy: 0.62,
    fakeBiteChance: 0.48,
    perfectWindow: 0.3,
    aimForgiveness: 1.05,
    coverageRadius: 0.74,
    reboundSaveChance: 0.3,
    xpMultiplier: 1.35,
    coinMultiplier: 1.35,
  },
  {
    id: 'allstar',
    name: 'All Star',
    order: 3,
    goalieMoveSpeed: 6.3,
    commitLeadTime: 0.28,
    readAccuracy: 0.74,
    fakeBiteChance: 0.36,
    perfectWindow: 0.22,
    aimForgiveness: 0.85,
    coverageRadius: 0.8,
    reboundSaveChance: 0.4,
    xpMultiplier: 1.6,
    coinMultiplier: 1.6,
  },
  {
    id: 'elite',
    name: 'Elite',
    order: 4,
    goalieMoveSpeed: 6.6,
    commitLeadTime: 0.2,
    readAccuracy: 0.85,
    fakeBiteChance: 0.26,
    perfectWindow: 0.15,
    aimForgiveness: 0.7,
    coverageRadius: 0.86,
    reboundSaveChance: 0.5,
    xpMultiplier: 1.9,
    coinMultiplier: 1.9,
  },
  {
    id: 'legend',
    name: 'Legend',
    order: 5,
    goalieMoveSpeed: 6.9,
    commitLeadTime: 0.12,
    readAccuracy: 0.94,
    fakeBiteChance: 0.16,
    perfectWindow: 0.09,
    aimForgiveness: 0.55,
    coverageRadius: 0.92,
    reboundSaveChance: 0.62,
    xpMultiplier: 2.4,
    coinMultiplier: 2.4,
  },
];

export function getDifficulty(id) {
  return DIFFICULTIES.find((d) => d.id === id) || DIFFICULTIES[0];
}

export function nextDifficulty(id) {
  const d = getDifficulty(id);
  return DIFFICULTIES[Math.min(d.order + 1, DIFFICULTIES.length - 1)];
}
