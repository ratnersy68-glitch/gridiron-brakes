// Player physics for all five movement forms. The player's screen X is
// fixed; the world scrolls underneath (camera.x == player's world X minus
// the fixed screen offset). Collision resolution happens in CollisionSystem
// which calls back into hooks exposed here (land(), die(), etc).

export const FORMS = {
  RUNNER: 'runner',   // cube-like: discrete jump, gravity flip via portals
  GLIDER: 'glider',   // ship-like: hold to fly up, free vertical movement
  ORB: 'orb',         // ball-like: tap flips gravity instantly, rolls
  PULSE: 'pulse',     // wave-like: diagonal zigzag, thin hitbox
  BOOSTER: 'booster', // ufo-like: tap = fixed burst jump, multi-tap chains
};

const GRAVITY = 2200;
const RUNNER_JUMP = 780;
const GLIDER_THRUST = 1500;
const GLIDER_MAX_VY = 620;
const PULSE_DIAG_SPEED = 520;
const BOOSTER_BURST_VY = -560;

export class Player {
  constructor() {
    this.reset();
  }

  reset(startX = 0, groundY = 500) {
    this.worldX = startX;
    this.y = groundY - 30;
    this.vy = 0;
    this.size = 30;
    this.baseSize = 30;
    this.mini = false;
    this.form = FORMS.RUNNER;
    this.gravityDir = 1; // 1 = normal (down), -1 = flipped
    this.onGround = false;
    this.rotation = 0;
    this.speedMult = 1;
    this.baseSpeed = 340;
    this.alive = true;
    this.trailTimer = 0;
    this.boosterUsed = false;
    this.justLanded = false;
    this.deathAt = null;
  }

  get speed() { return this.baseSpeed * this.speedMult; }
  get halfSize() { return (this.mini ? this.size * 0.6 : this.size) / 2; }

  setForm(form) {
    this.form = form;
    this.boosterUsed = false;
    if (form === FORMS.GLIDER || form === FORMS.PULSE) this.onGround = false;
  }

  setGravity(dir) { this.gravityDir = dir; }
  setMini(mini) { this.mini = mini; }
  setSpeedMult(mult) { this.speedMult = mult; }

  // ceilingY/groundY define the current flight corridor (levels can narrow it)
  update(dt, input, groundY, ceilingY = -Infinity) {
    if (!this.alive) return;
    const g = GRAVITY * this.gravityDir;
    this.worldX += this.speed * dt;

    switch (this.form) {
      case FORMS.RUNNER: {
        this.vy += g * dt;
        if (input.justPressed && this.onGround) {
          this.vy = -RUNNER_JUMP * this.gravityDir;
          this.onGround = false;
        }
        this.rotation += (this.onGround ? 0 : 1) * dt * 9 * this.gravityDir;
        break;
      }
      case FORMS.GLIDER: {
        this.vy += g * dt;
        if (input.pressed) this.vy -= GLIDER_THRUST * this.gravityDir * dt;
        this.vy = Math.max(-GLIDER_MAX_VY, Math.min(GLIDER_MAX_VY, this.vy));
        this.rotation = (this.vy / GLIDER_MAX_VY) * 0.35;
        break;
      }
      case FORMS.ORB: {
        this.vy += g * dt;
        if (input.justPressed) { this.gravityDir *= -1; this.vy = 0; }
        this.rotation += dt * 6;
        break;
      }
      case FORMS.PULSE: {
        const dir = input.pressed ? -1 : 1;
        this.vy = PULSE_DIAG_SPEED * dir * this.gravityDir;
        this.rotation = Math.atan2(this.vy, this.speed);
        break;
      }
      case FORMS.BOOSTER: {
        this.vy += g * 0.6 * dt;
        if (input.justPressed) {
          this.vy = BOOSTER_BURST_VY * this.gravityDir;
        }
        this.rotation = Math.max(-0.3, Math.min(0.3, this.vy / 900));
        break;
      }
    }

    this.y += this.vy * dt;

    // Corridor clamp for flight forms
    if (this.form === FORMS.GLIDER || this.form === FORMS.PULSE || this.form === FORMS.BOOSTER) {
      if (this.y - this.halfSize < ceilingY) { this.y = ceilingY + this.halfSize; this.vy = Math.max(this.vy, 0); }
    }

    this.justLanded = false;
    // Ground/ceiling snap for runner & orb forms
    if (this.form === FORMS.RUNNER || this.form === FORMS.ORB) {
      if (this.gravityDir === 1) {
        if (this.y + this.halfSize >= groundY) {
          if (!this.onGround) this.justLanded = true;
          this.y = groundY - this.halfSize;
          this.vy = 0;
          this.onGround = true;
          if (this.form === FORMS.RUNNER) this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
        } else this.onGround = false;
        if (this.y - this.halfSize < ceilingY) { this.y = ceilingY + this.halfSize; this.vy = Math.max(this.vy, 0); }
      } else {
        if (this.y - this.halfSize <= ceilingY) {
          if (!this.onGround) this.justLanded = true;
          this.y = ceilingY + this.halfSize;
          this.vy = 0;
          this.onGround = true;
        } else this.onGround = false;
        if (this.y + this.halfSize > groundY) { this.y = groundY - this.halfSize; this.vy = Math.min(this.vy, 0); }
      }
    }
  }

  getHitbox() {
    const h = this.halfSize;
    if (this.form === FORMS.PULSE) {
      return { x: this.worldX - h * 0.9, y: this.y - h * 0.35, w: h * 1.8, h: h * 0.7 };
    }
    return { x: this.worldX - h, y: this.y - h, w: h * 2, h: h * 2 };
  }

  kill() { this.alive = false; this.deathAt = { x: this.worldX, y: this.y }; }
}
