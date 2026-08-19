import { SHOT_TYPES, classifyZone } from '../data/shots.js';

function gaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// aim: net-local intended target {tx,ty} the player was pointing at, already
// including any manual movement, BEFORE randomized execution error.
export function resolveShot({ aim, deke, shotTypeId, holdDuration, special, loadoutStats, difficulty }) {
  const shotType = SHOT_TYPES[shotTypeId] || SHOT_TYPES.wrist;
  const stats = loadoutStats || { accuracy: 0, power: 0, dekeSpeed: 0, moveSpeed: 0 };

  const idealHold = shotType.chargeTime;
  const window = Math.max(0.05, difficulty.perfectWindow);
  const quality = clamp(1 - Math.abs(holdDuration - idealHold) / (window * 2.2), 0, 1);
  let powerScale = clamp(holdDuration / idealHold, 0.4, 1.25);

  let intended = { tx: aim.tx, ty: aim.ty };
  let specialId = null;
  let confusionBonus = 0;
  let extraSpeed = 0;
  let failed = false;

  if (special === 'spin') {
    specialId = 'spinMove';
    confusionBonus += 0.25;
    if (quality < 0.35) {
      powerScale *= 0.8;
    }
  } else if (special === 'michigan') {
    specialId = 'michigan';
    confusionBonus += 0.4;
    intended = { tx: aim.tx, ty: 0.95 };
    if (quality < 0.5) {
      failed = true; // puck pops off the blade — fair, visible miss
    }
  } else if (holdDuration <= 0.18 && (shotTypeId === 'wrist' || shotTypeId === 'snap')) {
    specialId = 'oneTimer';
    extraSpeed += 0.2;
    confusionBonus += 0.12;
  } else if (shotTypeId === 'slap' && powerScale >= 1.05) {
    specialId = 'powerShot';
    extraSpeed += 0.3;
  } else if (shotTypeId === 'backhand' && Math.abs(deke) > 0.4) {
    specialId = 'backhandDeke';
    confusionBonus += 0.1;
  }

  let errorMag = shotType.spread * difficulty.aimForgiveness * (1.5 - quality);
  errorMag *= 1 + Math.abs(deke) * 0.3 * (1 - stats.dekeSpeed * 3);
  errorMag *= clamp(1 - stats.accuracy, 0.55, 1.3);
  if (specialId === 'spinMove') errorMag *= quality < 0.35 ? 1.8 : 1.15;
  if (specialId === 'michigan') errorMag *= 1.3;

  const finalTx = intended.tx + gaussian() * errorMag;
  const finalTy = clamp(intended.ty + gaussian() * errorMag * 0.75, -0.2, 1.25);

  const finalPower = powerScale * (1 + extraSpeed) * (1 + stats.power);
  const zone = classifyZone(clamp(finalTx, -1.3, 1.3), clamp(finalTy, -0.2, 1.25));

  return {
    intended,
    final: { tx: finalTx, ty: finalTy },
    quality,
    powerScale: finalPower,
    shotType: shotTypeId,
    special: specialId,
    confusionBonus,
    zone,
    holdDuration,
    failed,
    outOfFrame: Math.abs(finalTx) > 1.02 || finalTy > 1.08 || finalTy < -0.05,
  };
}
