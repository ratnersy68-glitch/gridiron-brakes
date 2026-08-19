import * as THREE from 'three';

// All textures are drawn procedurally on <canvas> — no external image assets.
export function makeIceTexture(iceColorHex) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 2048;
  const ctx = c.getContext('2d');
  const iceColor = `#${iceColorHex.toString(16).padStart(6, '0')}`;
  ctx.fillStyle = iceColor;
  ctx.fillRect(0, 0, c.width, c.height);

  // subtle ice scratches
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 220; i++) {
    ctx.beginPath();
    const x = Math.random() * c.width, y = Math.random() * c.height;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 120);
    ctx.lineWidth = Math.random() * 1.5;
    ctx.stroke();
  }

  // goal line (red) near top of texture (net end)
  ctx.strokeStyle = '#cc2222';
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(0, 140); ctx.lineTo(c.width, 140); ctx.stroke();

  // blue line
  ctx.strokeStyle = '#2255cc';
  ctx.lineWidth = 14;
  ctx.beginPath(); ctx.moveTo(0, 780); ctx.lineTo(c.width, 780); ctx.stroke();

  // faceoff dot + circle in the zone
  ctx.strokeStyle = '#cc2222';
  ctx.fillStyle = '#cc2222';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(c.width * 0.5, 430, 90, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(c.width * 0.5, 430, 10, 0, Math.PI * 2); ctx.fill();

  // crease (blue) in front of goal line
  ctx.fillStyle = 'rgba(60,140,220,0.35)';
  ctx.beginPath();
  ctx.arc(c.width * 0.5, 140, 150, 0, Math.PI, false);
  ctx.fill();
  ctx.strokeStyle = '#2255cc'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(c.width * 0.5, 140, 150, 0, Math.PI, false); ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeNettingTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  const step = 16;
  for (let i = -256; i < 512; i += step) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 256); ctx.lineTo(i + 256, 0); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

export function makeReticleTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  ctx.strokeStyle = '#7fd6ff';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(64, 64, 44, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(64, 8); ctx.lineTo(64, 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(64, 98); ctx.lineTo(64, 120); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, 64); ctx.lineTo(30, 64); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(98, 64); ctx.lineTo(120, 64); ctx.stroke();
  ctx.fillStyle = '#ff3b3b';
  ctx.beginPath(); ctx.arc(64, 64, 5, 0, Math.PI * 2); ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  return tex;
}
