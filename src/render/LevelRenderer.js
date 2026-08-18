// Draws a live LevelRuntime frame: parallax background, all obstacle types
// (with neon glow), and the player in its current form/cosmetic loadout.

import { FORMS } from '../player/Player.js';

export function drawLevel(renderer, level, camX, elapsed) {
  renderer.drawBackground(level.theme, camX, level.groundY, elapsed);
  const ctx = renderer.ctx;
  ctx.save();
  ctx.translate(-camX, 0);

  for (const s of level.solids) {
    if (s.type === 'disappearingPlatform' && !s.visible) continue;
    const color = s.type === 'ground' ? level.theme.ground : level.theme.accent2;
    renderer.glowRect(s.x, s.y, s.w, s.h, color, s.type === 'ground' ? 6 : 12);
    if (s.type === 'disappearingPlatform') {
      ctx.globalAlpha = 0.5;
      renderer.glowRect(s.x, s.y - 3, s.w, 3, '#fff', 6);
      ctx.globalAlpha = 1;
    }
  }

  for (const h of level.hazards) {
    const color = h.fake ? level.theme.hazard : level.theme.hazard;
    ctx.globalAlpha = h.fake ? 0.92 : 1;
    if (h.shape === 'circle') {
      renderer.glowCircle(h.x, h.y, h.r, color, 14);
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(elapsed * 6);
      ctx.strokeStyle = '#fff8'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.rotate(Math.PI / 3); ctx.lineTo(h.r, 0); ctx.stroke(); }
      ctx.restore();
    } else {
      const pts = h.ceiling
        ? [[h.x, h.y], [h.x + h.w / 2, h.y + h.h], [h.x + h.w, h.y]]
        : [[h.x, h.y + h.h], [h.x + h.w / 2, h.y], [h.x + h.w, h.y + h.h]];
      renderer.glowPoly(pts, color, 12);
    }
    ctx.globalAlpha = 1;
  }

  for (const p of level.pads) {
    const color = p.kind === 'pink' ? '#ff37a4' : '#ffd23b';
    renderer.glowRect(p.x, p.y, p.w, p.h, color, 14);
  }

  for (const r of level.rings) {
    renderer.glowCircle(r.x, r.y, r.r, '#37f0ff', 16);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r * 0.5, 0, Math.PI * 2); ctx.stroke();
  }

  for (const p of level.portals) {
    renderer.glowRect(p.x, p.y, p.w, p.h, '#ff37a4', 18);
    if (p.label) renderer.text(p.label, p.x + p.w / 2, p.y - 10, { align: 'center', color: '#fff', glow: '#ff37a4', font: '700 12px Orbitron' });
  }

  for (const c of level.coins) {
    if (c.collected) continue;
    ctx.save();
    ctx.translate(c.x, c.y + Math.sin(elapsed * 4 + c.x * 0.01) * 6);
    ctx.rotate(elapsed * 2);
    renderer.glowCircle(0, 0, c.r, c.hard ? '#ff37a4' : '#ffd23b', 16);
    ctx.restore();
  }

  if (level.checkpoints) {
    for (const cx of level.checkpoints) renderer.glowRect(cx - 3, level.groundY - 120, 6, 120, '#37ff8f', 8);
  }

  if (level.end) renderer.glowRect(level.end.x, level.end.y, level.end.w, level.end.h, '#fff', 20);

  ctx.restore();
}

export function drawPlayer(renderer, player, colorHex, camX) {
  const ctx = renderer.ctx;
  const sx = player.worldX - camX;
  const sy = player.y;
  const h = player.halfSize;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(player.rotation);

  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 22;
  ctx.fillStyle = colorHex;

  switch (player.form) {
    case FORMS.RUNNER:
      ctx.fillRect(-h, -h, h * 2, h * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; ctx.strokeRect(-h, -h, h * 2, h * 2);
      break;
    case FORMS.ORB:
      ctx.beginPath(); ctx.arc(0, 0, h, 0, Math.PI * 2); ctx.fill();
      break;
    case FORMS.GLIDER:
      ctx.beginPath(); ctx.moveTo(-h, -h * 0.6); ctx.lineTo(h, 0); ctx.lineTo(-h, h * 0.6); ctx.closePath(); ctx.fill();
      break;
    case FORMS.PULSE:
      ctx.beginPath(); ctx.moveTo(-h, 0); ctx.lineTo(0, -h * 0.5); ctx.lineTo(h, 0); ctx.lineTo(0, h * 0.5); ctx.closePath(); ctx.fill();
      break;
    case FORMS.BOOSTER:
      ctx.beginPath(); ctx.ellipse(0, 0, h, h * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      break;
  }
  ctx.restore();
}
