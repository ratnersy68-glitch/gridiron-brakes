import * as THREE from 'three';

const TRAIL_LEN = 14;

export class EffectsManager {
  constructor(scene) {
    this.scene = scene;
    this.timeScale = 1;
    this._slowMoTimer = 0;
    this._slowMoTarget = 1;
    this._shakeTime = 0;
    this._shakeDuration = 0;
    this._shakeIntensity = 0;
    this.shakeOffset = new THREE.Vector3();

    this._trailSegs = [];
    this._trailColor = 0x2244ff;
    this._buildTrail();

    this._particles = [];
    this.snowSystem = null;
    this.confettiActive = false;
  }

  _buildTrail() {
    for (const s of this._trailSegs) this.scene.remove(s);
    this._trailSegs = [];
    for (let i = 0; i < TRAIL_LEN; i++) {
      const scale = 1 - i / TRAIL_LEN;
      const geo = new THREE.SphereGeometry(0.05 * scale + 0.01, 6, 6);
      const m = new THREE.MeshBasicMaterial({ color: this._trailColor, transparent: true, opacity: scale * 0.55, depthWrite: false });
      const mesh = new THREE.Mesh(geo, m);
      mesh.visible = false;
      this.scene.add(mesh);
      this._trailSegs.push(mesh);
    }
  }

  setTrailColor(hex) {
    this._trailColor = hex;
    for (const seg of this._trailSegs) seg.material.color.setHex(hex);
  }

  updateTrail(history) {
    // history: array of {x,y,z} newest last
    for (let i = 0; i < TRAIL_LEN; i++) {
      const idx = history.length - 1 - i;
      const seg = this._trailSegs[i];
      if (idx >= 0) {
        const p = history[idx];
        seg.position.set(p.x, p.y, p.z);
        seg.visible = true;
      } else {
        seg.visible = false;
      }
    }
  }

  hideTrail() {
    for (const s of this._trailSegs) s.visible = false;
  }

  triggerSlowMo(duration = 0.9, scale = 0.28) {
    this._slowMoTimer = duration;
    this._slowMoTarget = scale;
  }

  shake(intensity = 0.15, duration = 0.35) {
    this._shakeIntensity = Math.max(this._shakeIntensity, intensity);
    this._shakeDuration = duration;
    this._shakeTime = duration;
  }

  update(rawDt) {
    // slow-mo timescale
    if (this._slowMoTimer > 0) {
      this._slowMoTimer -= rawDt;
      this.timeScale += (this._slowMoTarget - this.timeScale) * Math.min(1, rawDt * 10);
      if (this._slowMoTimer <= 0) this._slowMoTimer = 0;
    } else {
      this.timeScale += (1 - this.timeScale) * Math.min(1, rawDt * 4);
    }

    // camera shake decay
    if (this._shakeTime > 0) {
      this._shakeTime -= rawDt;
      const t = Math.max(0, this._shakeTime / this._shakeDuration);
      const mag = this._shakeIntensity * t;
      this.shakeOffset.set(
        (Math.random() - 0.5) * mag,
        (Math.random() - 0.5) * mag,
        (Math.random() - 0.5) * mag * 0.5
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    this._updateParticles(rawDt);
  }

  applyCameraShake(camera) {
    camera.position.add(this.shakeOffset);
  }

  spawnIceSpray(position, count = 18) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.02 + Math.random() * 0.02, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      const speed = 1.5 + Math.random() * 2.5;
      const angle = Math.random() * Math.PI * 2;
      const up = Math.random() * 2.5;
      mesh.userData.vel = new THREE.Vector3(Math.cos(angle) * speed, up, Math.sin(angle) * speed);
      mesh.userData.life = 0.5 + Math.random() * 0.3;
      mesh.userData.age = 0;
      this.scene.add(mesh);
      this._particles.push(mesh);
    }
  }

  spawnConfettiBurst(position, count = 60) {
    const colors = [0xffd700, 0xdd2222, 0x2255dd, 0xffffff, 0x33cc55];
    for (let i = 0; i < count; i++) {
      const geo = new THREE.PlaneGeometry(0.06, 0.1);
      const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide, transparent: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.y += Math.random() * 2;
      const speed = 1 + Math.random() * 3;
      const angle = Math.random() * Math.PI * 2;
      mesh.userData.vel = new THREE.Vector3(Math.cos(angle) * speed * 0.6, 3 + Math.random() * 3, Math.sin(angle) * speed * 0.6);
      mesh.userData.spin = (Math.random() - 0.5) * 10;
      mesh.userData.life = 1.6 + Math.random() * 0.8;
      mesh.userData.age = 0;
      mesh.userData.gravity = 3.2;
      this.scene.add(mesh);
      this._particles.push(mesh);
    }
  }

  _updateParticles(dt) {
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.userData.age += dt;
      if (p.userData.age >= p.userData.life) {
        this.scene.remove(p);
        p.geometry.dispose(); p.material.dispose();
        this._particles.splice(i, 1);
        continue;
      }
      const g = p.userData.gravity || 5;
      p.userData.vel.y -= g * dt;
      p.position.addScaledVector(p.userData.vel, dt);
      if (p.userData.spin) p.rotation.z += p.userData.spin * dt;
      p.material.opacity = 1 - p.userData.age / p.userData.life;
    }
  }

  setSnow(active) {
    if (active && !this.snowSystem) {
      const count = 400;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = Math.random() * 18;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.8 });
      this.snowSystem = new THREE.Points(geo, mat);
      this.scene.add(this.snowSystem);
    } else if (!active && this.snowSystem) {
      this.scene.remove(this.snowSystem);
      this.snowSystem.geometry.dispose(); this.snowSystem.material.dispose();
      this.snowSystem = null;
    }
  }

  updateSnow(dt) {
    if (!this.snowSystem) return;
    const pos = this.snowSystem.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - dt * 1.6;
      let x = pos.getX(i) + Math.sin(y * 0.5) * dt * 0.3;
      if (y < 0) y = 18;
      pos.setY(i, y);
      pos.setX(i, x);
    }
    pos.needsUpdate = true;
  }

  bounceCrowd(crowdGroup, intensity = 1) {
    if (!crowdGroup) return;
    const base = crowdGroup.userData.baseY ?? crowdGroup.position.y;
    crowdGroup.userData.baseY = base;
    crowdGroup.userData.bounce = { t: 0, intensity };
  }

  updateCrowd(crowdGroup, dt) {
    if (!crowdGroup || !crowdGroup.userData.bounce) return;
    const b = crowdGroup.userData.bounce;
    b.t += dt * 6;
    const amp = Math.max(0, b.intensity * Math.sin(b.t) * Math.exp(-b.t * 0.35));
    crowdGroup.position.y = (crowdGroup.userData.baseY ?? 0) + amp * 0.15;
    if (b.t > 6) crowdGroup.userData.bounce = null;
  }
}

// Procedural celebration tweens applied to a shooter model's parts group.
export function playCelebration(parts, id, elapsed) {
  const t = elapsed;
  switch (id) {
    case 'cel_stickraise': {
      const lift = Math.min(1, t / 0.3);
      parts.armR.rotation.x = -lift * 2.4;
      parts.stickGroup.rotation.x = -lift * 2.4;
      parts.hips.position.y = 0.55 + Math.sin(t * 6) * 0.02 * Math.max(0, 1 - t);
      break;
    }
    case 'cel_slide': {
      const slide = Math.min(1, t / 0.4);
      parts.hips.rotation.z = slide * 1.55;
      parts.hips.position.y = 0.55 - slide * 0.32;
      parts.hips.position.z = -slide * 1.4;
      parts.armL.rotation.x = -slide * 1.8;
      parts.armR.rotation.x = -slide * 1.8;
      break;
    }
    case 'cel_superman': {
      const s = Math.min(1, t / 0.35);
      parts.hips.rotation.x = -s * 1.3;
      parts.hips.position.y = 0.55 - s * 0.25;
      parts.armL.rotation.x = -s * 2.6; parts.armR.rotation.x = -s * 2.6;
      break;
    }
    case 'cel_bowandarrow': {
      const s = Math.min(1, t / 0.35);
      parts.armR.rotation.x = -s * 1.6;
      parts.armR.rotation.z = -s * 0.6;
      parts.armL.rotation.z = s * 1.2;
      parts.hips.rotation.y = Math.sin(t * 4) * 0.15 * Math.max(0, 1 - t / 1.2);
      break;
    }
    default: { // fist pump
      const lift = Math.abs(Math.sin(t * 5)) * Math.max(0, 1 - t / 1.2);
      parts.armR.rotation.x = -lift * 2.2;
      parts.armL.rotation.x = -lift * 1.2;
    }
  }
}

export function resetPose(parts) {
  parts.armL.rotation.set(0, 0, 0);
  parts.armR.rotation.set(0, 0, 0);
  parts.hips.rotation.set(0, 0, 0);
  parts.hips.position.set(0, 0.55, parts.hips.position.z);
  if (parts.stickGroup) parts.stickGroup.rotation.set(0, 0, 0);
}
