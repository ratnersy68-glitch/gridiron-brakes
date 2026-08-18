// Updates dynamic level objects (moving platforms, sweeping saws,
// disappearing platforms) and resolves collisions between the player and
// the level each frame. Pure functions of (level, player, time) so it is
// trivially testable / reusable by the editor's test-play mode.

function aabbOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleAabbOverlap(cx, cy, r, box) {
  const nx = Math.max(box.x, Math.min(cx, box.x + box.w));
  const ny = Math.max(box.y, Math.min(cy, box.y + box.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function updateDynamics(level, t) {
  for (const s of level.solids) {
    if (s.type === 'movingPlatform') {
      const off = Math.sin(t * s.speed + s.phase) * s.amplitude;
      if (s.axis === 'y') { s.y = s.baseY + off; s.x = s.baseX; }
      else { s.x = s.baseX + off; s.y = s.baseY; }
    } else if (s.type === 'disappearingPlatform') {
      const cycle = s.onTime + s.offTime;
      const local = ((t + s.phase) % cycle + cycle) % cycle;
      s.visible = local < s.onTime;
    }
  }
  for (const h of level.hazards) {
    if (h.movingHazard) {
      const off = Math.sin(t * h.speed + h.phase) * h.amplitude;
      if (h.axis === 'y') { h.y = h.baseY + off; } else { h.x = h.baseX + off; }
    }
  }
}

// Returns { dead, landed, events: [...] }
export function resolvePlayer(level, player, input, dt) {
  const box = player.getHitbox();
  const result = { dead: false, landed: false, events: [] };

  // Solids (ground/blocks/platforms) — land on top, otherwise crash.
  for (const s of level.solids) {
    if (s.type === 'disappearingPlatform' && !s.visible) continue;
    if (!aabbOverlap(box, s)) continue;
    const prevBottom = box.y + box.h - player.vy * dt - 1;
    const fallingOntoTop = player.gravityDir === 1 ? (player.vy >= 0 && prevBottom <= s.y + 6) : false;
    const risingOntoBottom = player.gravityDir === -1 ? (player.vy <= 0 && (box.y - player.vy * dt) >= s.y + s.h - 6) : false;
    if (fallingOntoTop) {
      player.y = s.y - player.halfSize;
      player.vy = 0;
      player.onGround = true;
      result.landed = true;
    } else if (risingOntoBottom) {
      player.y = s.y + s.h + player.halfSize;
      player.vy = 0;
      player.onGround = true;
      result.landed = true;
    } else {
      result.dead = true;
    }
  }

  // Hazards
  for (const h of level.hazards) {
    if (h.fake) continue; // visually identical, but harmless
    let hit = false;
    if (h.shape === 'circle') hit = circleAabbOverlap(h.x, h.y, h.r, box);
    else hit = aabbOverlap(box, h);
    if (hit) { result.dead = true; break; }
  }

  // Ground bounds (fell into a gap / flew off top or bottom of world)
  if (player.y > level.killY || player.y < -400) result.dead = true;

  // Pads
  for (const p of level.pads) {
    if (aabbOverlap(box, p)) {
      player.vy = -p.power * player.gravityDir;
      player.onGround = false;
      result.events.push({ type: 'pad' });
    }
  }

  // Rings — only trigger on a fresh tap while overlapping
  for (const r of level.rings) {
    if (input.justPressed && circleAabbOverlap(r.x, r.y, r.r, box)) {
      player.vy = -r.power * player.gravityDir;
      player.onGround = false;
      result.events.push({ type: 'ring' });
    }
  }

  // Portals
  for (const p of level.portals) {
    if (p._armed === undefined) p._armed = true;
    const overlapping = aabbOverlap(box, p);
    if (overlapping && p._armed) {
      p._armed = false;
      applyPortalEffect(player, p.effect);
      result.events.push({ type: 'portal', effect: p.effect });
    } else if (!overlapping) {
      p._armed = true;
    }
  }

  // Coins
  for (const c of level.coins) {
    if (!c.collected && Math.hypot(box.x + box.w / 2 - c.x, box.y + box.h / 2 - c.y) < c.r + 16) {
      c.collected = true;
      result.events.push({ type: 'coin', coin: c });
    }
  }

  // End
  if (level.end && box.x + box.w >= level.end.x) result.events.push({ type: 'complete' });

  return result;
}

function applyPortalEffect(player, effect) {
  if (effect.gravity !== undefined) player.setGravity(effect.gravity);
  if (effect.form) player.setForm(effect.form);
  if (effect.speedMult !== undefined) player.setSpeedMult(effect.speedMult);
  if (effect.mini !== undefined) player.setMini(effect.mini);
}
