import * as THREE from 'three';

// Analytic flight path: a puck traveling origin -> target with a vertical
// arc (higher for elevated shots, nearly flat for low ones) plus a subtle
// lateral wobble for "biscuit" feel. Deterministic and collision-free by
// design — outcome (goal/save/post/miss) is decided by shotResolver +
// goalieAI beforehand; this just renders it convincingly.
export class PuckFlight {
  constructor(origin, target, duration, arcHeight, curve = 0) {
    this.origin = origin.clone();
    this.target = target.clone();
    this.duration = Math.max(0.08, duration);
    this.arcHeight = arcHeight;
    this.curve = curve;
    this.t = 0;
    this.done = false;
    this.history = [];
    this._perp = new THREE.Vector3().subVectors(target, origin).cross(new THREE.Vector3(0, 1, 0)).normalize();
  }

  step(dt) {
    if (this.done) return this.target;
    this.t += dt / this.duration;
    const clamped = Math.min(1, this.t);
    const pos = new THREE.Vector3().lerpVectors(this.origin, this.target, clamped);
    pos.y += Math.sin(Math.PI * clamped) * this.arcHeight;
    pos.addScaledVector(this._perp, Math.sin(Math.PI * clamped) * this.curve);
    this.history.push({ x: pos.x, y: pos.y, z: pos.z });
    if (this.history.length > 40) this.history.shift();
    this.position = pos;
    if (this.t >= 1) this.done = true;
    return pos;
  }
}

// Short post-save deflection bounce, purely cosmetic.
export class ReboundBounce {
  constructor(origin, dir, speed = 3) {
    this.pos = origin.clone();
    this.vel = dir.clone().normalize().multiplyScalar(speed);
    this.vel.y += 2.2;
    this.gravity = 9;
    this.t = 0;
    this.done = false;
  }
  step(dt) {
    this.t += dt;
    this.vel.y -= this.gravity * dt;
    this.pos.addScaledVector(this.vel, dt);
    if (this.pos.y <= 0.03) {
      this.pos.y = 0.03;
      this.done = true;
    }
    return this.pos;
  }
}
