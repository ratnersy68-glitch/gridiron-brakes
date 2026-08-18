// Lightweight pooled particle system for trails, death bursts and coin pops.

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.enabled = true;
  }

  burst(x, y, color, count = 18, opts = {}) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (opts.speed || 180) * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: opts.life || 0.6,
        age: 0,
        size: opts.size || 4 + Math.random() * 3,
        color,
        gravity: opts.gravity ?? 400,
      });
    }
  }

  trail(x, y, color, size = 3) {
    if (!this.enabled) return;
    this.particles.push({ x, y, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20, life: 0.4, age: 0, size, color, gravity: 0 });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.life) { this.particles.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    if (this.particles.length > 800) this.particles.splice(0, this.particles.length - 800);
  }

  render(ctx, camX) {
    for (const p of this.particles) {
      const t = 1 - p.age / p.life;
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillStyle = p.color;
      const s = p.size * t;
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y, Math.max(s, 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  clear() { this.particles.length = 0; }
}
