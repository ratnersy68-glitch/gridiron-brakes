// Canvas renderer: parallax backgrounds, glow-heavy neon obstacle drawing,
// camera/screen shake, and beat-synced background pulsing.

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.shake = 0;
    this.pulse = 0; // 0..1 decays, driven by audio beats
    this.quality = 'high';
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  addShake(amount) { this.shake = Math.min(this.shake + amount, 24); }
  addPulse(amount = 1) { this.pulse = Math.min(1, this.pulse + amount); }

  beginFrame(dt) {
    this.shake *= Math.max(0, 1 - dt * 6);
    this.pulse *= Math.max(0, 1 - dt * 4);
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0.3) {
      const sx = (Math.random() - 0.5) * this.shake;
      const sy = (Math.random() - 0.5) * this.shake;
      ctx.translate(sx, sy);
    }
  }

  endFrame() { this.ctx.restore(); }

  clear() {
    this.ctx.clearRect(-40, -40, this.width + 80, this.height + 80);
  }

  drawBackground(theme, camX, groundY, time) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, theme.bg2);
    grad.addColorStop(1, theme.bg1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Pulsating glow overlay synced to music beats
    if (this.pulse > 0.01) {
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = this.pulse * 0.08;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalAlpha = 1;
    }

    // Parallax layers: far shapes drift slowly, near stripes drift faster
    this._drawParallaxLayer(camX * 0.15, theme.accent2, 0.05, 60, groundY, time, 40);
    this._drawParallaxLayer(camX * 0.35, theme.accent, 0.08, 34, groundY, time, 90);
    this._drawGroundGlow(theme, groundY);
  }

  _drawParallaxLayer(offset, color, alpha, size, groundY, time, spacing) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    const start = Math.floor(-offset / spacing) * spacing;
    for (let x = start; x < start + this.width + spacing * 2; x += spacing) {
      const sx = x + offset;
      const bob = Math.sin((x * 0.01) + time * 0.6) * 14;
      ctx.beginPath();
      ctx.arc((sx % (this.width + spacing * 4)) - offset % spacing, groundY - 120 - bob - (size % 200), size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _drawGroundGlow(theme, groundY) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, groundY - 40, 0, groundY + 6);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, theme.accent);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = grad;
    ctx.fillRect(0, groundY - 40, this.width, 46);
    ctx.globalAlpha = 1;
  }

  glowRect(x, y, w, h, color, glow = 14) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  glowPoly(points, color, glow = 14, fill = true) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.beginPath();
    points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.closePath();
    if (fill) { ctx.fillStyle = color; ctx.fill(); }
    else { ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.restore();
  }

  glowCircle(x, y, r, color, glow = 14) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  text(str, x, y, opts = {}) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = opts.font || '16px "Segoe UI", sans-serif';
    ctx.fillStyle = opts.color || '#fff';
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = opts.baseline || 'alphabetic';
    if (opts.glow) { ctx.shadowColor = opts.glow; ctx.shadowBlur = 10; }
    ctx.fillText(str, x, y);
    ctx.restore();
  }
}
