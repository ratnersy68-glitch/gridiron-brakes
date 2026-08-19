const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

// Predicts the goalie's committed stance from cues available DURING the
// charge — the player's aim direction so far, deke movement, and shot type
// — not the final (post-error) shot outcome. This is what "reads the
// player" means: the AI can be right, wrong, or fooled, same as a human.
export function predictGoalie({ intended, deke, shotTypeId, difficulty, personality, confusionBonus = 0 }) {
  let readAccuracy = clamp(difficulty.readAccuracy + (personality.readAccuracyBonus || 0) - confusionBonus, 0.05, 0.98);

  // Slower, more telegraphed shots (slap) give the goalie more information.
  const tellBonus = { slap: 0.14, wrist: 0.02, snap: -0.06, backhand: -0.02 }[shotTypeId] || 0;
  readAccuracy = clamp(readAccuracy + tellBonus, 0.05, 0.98);

  let guessX = (Math.random() * 2 - 1) * 1.1;
  let guessY = Math.random() * 1.1;

  let fakeBiteChance = clamp(
    difficulty.fakeBiteChance * (1 + personality.aggression * 0.4) - (personality.fakeResistance || 0),
    0, 0.95
  );
  if (personality.randomize) fakeBiteChance = clamp(fakeBiteChance + (Math.random() - 0.5) * 0.3, 0, 0.95);

  let bit = false;
  if (Math.abs(deke) > 0.15 && Math.random() < fakeBiteChance) {
    // Classic goaltending error: overcommits toward the direction the
    // shooter skated, leaving the far side open.
    guessX = deke * (0.7 + Math.random() * 0.5);
    bit = true;
  } else {
    guessX = intended.tx * readAccuracy + guessX * (1 - readAccuracy);
  }
  guessY = intended.ty * readAccuracy + guessY * (1 - readAccuracy);
  guessY = clamp(guessY, 0, 1.05);

  // personality height bias nudges the guess toward its comfort zone
  if (personality.highBias > personality.lowBias) guessY = clamp(guessY * 1.05, 0, 1.05);
  else guessY = clamp(guessY * 0.95, 0, 1.05);

  let commitStyle = 'stand';
  if (guessY > 0.62) commitStyle = 'reachHigh';
  else if (guessY < 0.32) commitStyle = 'butterfly';
  if (Math.abs(guessX) > 0.55 && commitStyle === 'stand') {
    commitStyle = guessX > 0 ? 'diveRight' : 'diveLeft';
  }

  return { commitStyle, commitX: clamp(guessX, -1.15, 1.15), commitY: guessY, readAccuracy, bit };
}

// Judges the actual (post-error) shot against the goalie's committed
// stance. Returns save/goal + a point for the puck to visually stop at.
export function judgeShot({ final, commitStyle, commitX, difficulty, personality, quality }) {
  const tx = final.tx, ty = final.ty;
  const d = Math.abs(tx - commitX);
  const radius = difficulty.coverageRadius * (0.9 + (personality.fakeResistance || 0) * 0.2);
  const lateralCover = clamp(1 - d / (radius * 1.4), 0, 1);

  let yFit;
  if (commitStyle === 'butterfly') {
    yFit = 1 - smoothstep(0.32, 0.85, ty);
    yFit *= 1 - (personality.fiveHoleWeakness || 0) * (ty < 0.14 ? 0.6 : 0);
  } else if (commitStyle === 'reachHigh') {
    yFit = smoothstep(0.32, 0.65, ty);
  } else if (commitStyle === 'diveLeft' || commitStyle === 'diveRight') {
    yFit = 0.85;
  } else {
    yFit = 1 - smoothstep(0.78, 1.05, ty) * 1.2;
    if (ty < 0.14 && Math.abs(tx) < 0.22) yFit *= 1 - (0.55 + (personality.fiveHoleWeakness || 0));
  }
  yFit = clamp(yFit, 0, 1);

  const coveredFactor = clamp(lateralCover * yFit, 0, 1);
  const perfectPenalty = quality > 0.85 ? 0.12 : 0;
  const saveProb = clamp(coveredFactor - perfectPenalty, 0, 0.97);

  const isEdge = Math.abs(tx) > 0.82 || ty > 0.88;
  const roll = Math.random();

  if (isEdge && roll > saveProb * 0.6 && roll < saveProb * 0.6 + 0.14) {
    // post/crossbar chance near the frame
    const goesIn = quality > 0.7 && Math.random() < 0.5;
    return { result: goesIn ? 'goal' : 'post', coveredFactor, saveProb, special: goesIn ? 'postAndIn' : null };
  }

  if (roll < saveProb) {
    return { result: 'save', coveredFactor, saveProb };
  }
  return { result: 'goal', coveredFactor, saveProb };
}
