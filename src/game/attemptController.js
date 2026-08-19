import * as THREE from 'three';
import { SHOT_TYPES } from '../data/shots.js';
import { resolveShot } from './shotResolver.js';
import { predictGoalie, judgeShot } from './goalieAI.js';
import { PuckFlight, ReboundBounce } from './physics.js';
import { playCelebration, resetPose } from '../render/effects.js';
import { makeReticleTexture } from '../render/textures.js';
import { NET_HALF_WIDTH, NET_HEIGHT, PUCK_START_Z, CREASE_Z } from '../render/rinkBuilder.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

const GOALIE_POSES = {
  stand: { dy: 0, dz: 0, tilt: 0, spread: 0, armUp: 0 },
  butterfly: { dy: -0.34, dz: 0.1, tilt: 0, spread: 0.5, armUp: 0 },
  reachHigh: { dy: 0.08, dz: 0, tilt: 0, spread: 0, armUp: 1 },
  diveLeft: { dy: -0.22, dz: 0, tilt: -1.15, spread: 0.2, armUp: 0.3 },
  diveRight: { dy: -0.22, dz: 0, tilt: 1.15, spread: 0.2, armUp: 0.3 },
};

export class AttemptController {
  constructor({ scene, camera, effects, audio, input, shooterModel, goalieModel, puckMesh, crowdGroup }) {
    this.scene = scene;
    this.camera = camera;
    this.effects = effects;
    this.audio = audio;
    this.input = input;
    this.shooter = shooterModel;
    this.goalie = goalieModel;
    this.puck = puckMesh;
    this.crowdGroup = crowdGroup;

    this.phase = 'idle';
    this.history = [];
    this.chargeStart = 0;
    this.specialQueued = null;
    this.cfg = null;
    this.onResult = null;

    this._flight = null;
    this._rebound = null;
    this._resolveData = null;
    this._decision = null;
    this._goaliePoseTarget = { ...GOALIE_POSES.stand };
    this._goaliePoseCurrent = { ...GOALIE_POSES.stand };
    this._goalieSide = 0;
    this._flightDuration = 1;
    this._camShakeDoneImpact = false;
    this._resultTimer = 0;
    this._replay = null;

    this.reticle = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeReticleTexture(), transparent: true, depthTest: false }));
    this.reticle.scale.set(0.5, 0.5, 0.5);
    this.reticle.visible = false;
    this.reticle.renderOrder = 10;
    this.scene.add(this.reticle);

    input.onChargeStart = () => this._onChargeStart();
    input.onChargeEnd = (duration, deke) => this._onRelease(duration, deke);
    input.onSpecialTrigger = () => { this.specialQueued = this._pickSpecial(); };
  }

  configure(cfg) {
    // { difficulty, personality, loadoutStats, celebrationId, trailColor }
    this.cfg = cfg;
    this.effects.setTrailColor(cfg.trailColor || 0x2244ff);
  }

  startAttempt() {
    this.phase = 'ready';
    this.history = [];
    this.specialQueued = null;
    this._flight = null;
    this._rebound = null;
    this._camShakeDoneImpact = false;
    this._resultTimer = 0;
    this._replay = null;
    this.effects.hideTrail();
    resetPose(this.shooter.userData.parts);
    this.shooter.userData.parts.hips.position.x = 0;
    this._goaliePoseTarget = { ...GOALIE_POSES.stand };
    this._goaliePoseCurrent = { ...GOALIE_POSES.stand };
    this._applyGoaliePose(1);
    this.puck.position.set(0, 0.045, PUCK_START_Z - 0.6);
    this.puck.visible = true;
    this.reticle.visible = true;
    this.input.setEnabled(true);
  }

  _updateReticle() {
    const aim = this._netLocalAim();
    this.reticle.position.set(
      clamp(aim.tx, -1.5, 1.5) * NET_HALF_WIDTH,
      clamp(Math.max(0.1, aim.ty), -0.15, 1.35) * NET_HEIGHT,
      0.05
    );
  }

  _netLocalAim() {
    const tx = clamp(this.input.aim.x * 1.25, -1.5, 1.5);
    const ty = clamp(((this.input.aim.y + 1) / 2) * 1.25 - 0.1, -0.25, 1.35);
    return { tx, ty };
  }

  _pickSpecial() {
    if (!this.input.charging) return null;
    if (Math.abs(this.input.dekeAmount) > 0.7) return 'michigan';
    if (Math.abs(this.input.dekeAmount) > 0.35) return 'spin';
    return null;
  }

  _onChargeStart() {
    if (this.phase !== 'ready') return;
    this.phase = 'charging';
    this.chargeStart = performance.now();
    this.history = [];
    this.audio.click();
  }

  _onRelease(duration, deke) {
    if (this.phase !== 'charging') return;
    this._fire(duration, deke);
  }

  _fire(holdDuration, deke) {
    this.phase = 'firing';
    this.input.setEnabled(false);
    this.reticle.visible = false;
    const aim = this._netLocalAim();
    const shotTypeId = this.input.shotType;
    const { difficulty, personality, loadoutStats } = this.cfg;

    const result = resolveShot({
      aim, deke, shotTypeId, holdDuration,
      special: this.specialQueued, loadoutStats, difficulty,
    });

    const commitLead = difficulty.commitLeadTime;
    const commitSampleTime = Math.max(0, holdDuration - commitLead);
    let sample = this.history[this.history.length - 1] || { tx: aim.tx, ty: aim.ty, deke };
    for (const h of this.history) {
      if (h.t >= commitSampleTime) { sample = h; break; }
    }

    const decision = predictGoalie({
      intended: { tx: sample.tx, ty: sample.ty },
      deke: sample.deke,
      shotTypeId, difficulty, personality,
      confusionBonus: result.confusionBonus,
    });

    let outcome;
    if (result.failed || result.outOfFrame) {
      outcome = { result: 'miss' };
    } else {
      outcome = judgeShot({ final: result.final, commitStyle: decision.commitStyle, commitX: decision.commitX, difficulty, personality, quality: result.quality });
      // physical feasibility check: can the goalie actually get there in time?
      if (outcome.result === 'save') {
        const requiredTravel = Math.abs(decision.commitX - this._goalieSide) * NET_HALF_WIDTH * 1.3 + (decision.commitStyle === 'butterfly' ? 0.3 : 0);
        const shotType = SHOT_TYPES[shotTypeId];
        const flightDurationEstimate = 1.15 / (shotType.speedMult * result.powerScale * 0.9 + 0.35);
        const budget = commitLead + flightDurationEstimate * 0.55;
        const timeNeeded = requiredTravel / difficulty.goalieMoveSpeed;
        if (timeNeeded > budget) outcome = { result: 'goal', beatBySpeed: true };
      }
    }

    this._resolveData = { ...result, shotType: shotTypeId, holdDuration, timeToRelease: holdDuration };
    this._decision = decision;
    this._startFlight(result, outcome, shotTypeId);
  }

  _startFlight(result, outcome, shotTypeId) {
    const shotType = SHOT_TYPES[shotTypeId];
    this.phase = 'flight';
    this._outcome = outcome;

    const parts = this.shooter.userData.parts;
    this._swingT = 0;
    this._swingStartArm = parts.armR.rotation.x;
    this._swingStartStick = parts.stickGroup.rotation.x;

    const origin = new THREE.Vector3(this.puck.position.x, 0.045, this.puck.position.z);
    let target, arcHeight, curve;
    const speed = 16 * shotType.speedMult * clamp(result.powerScale, 0.5, 1.3);
    const tx = clamp(result.final.tx, -1.6, 1.6);
    const ty = clamp(result.final.ty, -0.3, 1.4);

    if (outcome.result === 'miss') {
      target = new THREE.Vector3(tx * NET_HALF_WIDTH * 1.15, Math.max(0.05, ty * NET_HEIGHT), -1.4);
      arcHeight = 0.3 + Math.max(0, ty) * 0.6;
      curve = (Math.random() - 0.5) * 0.4;
    } else if (outcome.result === 'post') {
      const postX = Math.sign(tx || 1) * NET_HALF_WIDTH;
      target = new THREE.Vector3(clamp(tx * NET_HALF_WIDTH, -postX - 0.05, postX + 0.05), Math.max(0.1, ty * NET_HEIGHT), 0.05);
      arcHeight = 0.15 + Math.max(0, ty) * 0.3;
      curve = 0;
    } else if (outcome.result === 'save') {
      const gx = this._decision.commitX * NET_HALF_WIDTH * 0.8;
      const gy = this._decision.commitStyle === 'butterfly' ? 0.15 : this._decision.commitStyle === 'reachHigh' ? NET_HEIGHT * 0.85 : 0.55;
      target = new THREE.Vector3(gx, gy, CREASE_Z * 0.55);
      arcHeight = 0.12 + Math.max(0, ty) * 0.35;
      curve = 0;
    } else {
      target = new THREE.Vector3(tx * NET_HALF_WIDTH, Math.max(0.05, ty * NET_HEIGHT), -0.55);
      arcHeight = 0.1 + Math.max(0, ty) * 0.55;
      curve = (Math.random() - 0.5) * 0.08;
    }

    const dist = origin.distanceTo(target);
    this._flightDuration = clamp(dist / speed, 0.28, 1.5);
    this._flight = new PuckFlight(origin, target, this._flightDuration, arcHeight, curve);

    this._goaliePoseTarget = { ...(GOALIE_POSES[this._decision.commitStyle] || GOALIE_POSES.stand) };
    this._goalieSide = this._decision.commitX;

    this.audio.puckHit(clamp(result.powerScale, 0.4, 1.3));
    this.effects.shake(0.05 + clamp(result.powerScale - 0.6, 0, 0.7) * 0.12, 0.2);
  }

  update(dt) {
    if (this.phase === 'ready') {
      this._updateReticle();
    } else if (this.phase === 'charging') {
      const t = (performance.now() - this.chargeStart) / 1000;
      const aim = this._netLocalAim();
      this.history.push({ t, tx: aim.tx, ty: aim.ty, deke: this.input.dekeAmount });
      if (this.history.length > 240) this.history.shift();

      this.input.applyKeyboardDeke(dt);
      const shooterHips = this.shooter.userData.parts.hips;
      shooterHips.position.x = lerp(shooterHips.position.x, this.input.dekeAmount * 0.9, dt * 6);
      const idealHold = SHOT_TYPES[this.input.shotType].chargeTime;
      const chargeProgress = clamp(t / idealHold, 0, 1.3);
      this.shooter.userData.parts.armR.rotation.x = -chargeProgress * 0.9;
      this.shooter.userData.parts.stickGroup.rotation.x = -chargeProgress * 0.7;
      this.puck.position.x = shooterHips.position.x * 0.7;
      this._updateReticle();

      // idle goalie tracking (cosmetic only — not the real decision)
      this._goaliePoseTarget = { ...GOALIE_POSES.stand };
      this._goalieSide = clamp(aim.tx * 0.25 + Math.sin(t * 2) * 0.06, -0.4, 0.4);
      this._applyGoaliePose(dt * 3);
    } else if (this.phase === 'flight') {
      const scaledDt = dt * this.effects.timeScale;
      const pos = this._flight.step(scaledDt);
      this.puck.position.copy(pos);
      this.puck.rotation.x += scaledDt * 18;
      this.effects.updateTrail(this._flight.history);

      this._swingT += dt;
      const st = clamp(this._swingT / 0.22, 0, 1);
      const ease = 1 - Math.pow(1 - st, 3);
      const parts = this.shooter.userData.parts;
      parts.armR.rotation.x = lerp(this._swingStartArm, 0.75, ease);
      parts.stickGroup.rotation.x = lerp(this._swingStartStick, 0.95, ease);

      if (this.puck.position.z < 5 && !this._slowMoStarted) {
        this._slowMoStarted = true;
        this.effects.triggerSlowMo(0.85, this._resolveData.special ? 0.22 : 0.32);
      }

      this._applyGoaliePose(dt * (this.cfg.difficulty.goalieMoveSpeed / 3));

      if (this._flight.done) {
        this._onImpact();
      }
    } else if (this.phase === 'impact') {
      this._resultTimer += dt;
      if (this._rebound) {
        const p = this._rebound.step(dt);
        this.puck.position.copy(p);
      }
      if (this._resultTimer > 1.1) {
        this._finish();
      }
    } else if (this.phase === 'result') {
      this._resultTimer += dt;
      const elapsed = this._resultTimer;
      if (this._outcome.result === 'goal') {
        playCelebration(this.shooter.userData.parts, this.cfg.celebrationId, elapsed);
      }
      this.effects.updateCrowd(this.crowdGroup, dt);
      if (elapsed > 2.6) {
        this.phase = 'done';
      }
    }
  }

  _applyGoaliePose(alpha) {
    const a = clamp(alpha, 0, 1);
    for (const k of Object.keys(this._goaliePoseCurrent)) {
      this._goaliePoseCurrent[k] = lerp(this._goaliePoseCurrent[k], this._goaliePoseTarget[k], a);
    }
    const parts = this.goalie.userData.parts;
    const p = this._goaliePoseCurrent;
    parts.hips.position.x = this._goalieSide * NET_HALF_WIDTH * 0.85;
    parts.hips.position.y = 0.5 + p.dy;
    parts.hips.position.z = p.dz;
    parts.hips.rotation.z = p.tilt;
    parts.padL.rotation.z = p.spread * 1.1;
    parts.padR.rotation.z = -p.spread * 1.1;
    const armSign = this._goalieSide >= 0 ? 1 : -1;
    if (armSign > 0) {
      parts.blockerArm.rotation.x = -p.armUp * 1.6;
      parts.gloveArm.rotation.x = -p.armUp * 0.6;
    } else {
      parts.gloveArm.rotation.x = -p.armUp * 1.6;
      parts.blockerArm.rotation.x = -p.armUp * 0.6;
    }
  }

  _onImpact() {
    this.phase = 'impact';
    this._resultTimer = 0;
    this._slowMoStarted = false;
    const res = this._outcome.result;
    const point = this.puck.position.clone();

    if (res === 'goal') {
      this.audio.goalHorn();
      this.audio.crowdSwell(1.2, 2);
      this.effects.shake(0.35, 0.5);
      this.effects.bounceCrowd(this.crowdGroup, 1.4);
      this.effects.spawnIceSpray(point, 10);
    } else if (res === 'save') {
      this.audio.save();
      this.audio.crowdGroan();
      this.effects.shake(0.12, 0.25);
      this.effects.spawnIceSpray(point, 22);
      const dir = new THREE.Vector3((Math.random() - 0.5), 0.2, 1).normalize();
      this._rebound = new ReboundBounce(point, dir, 2.5);
    } else if (res === 'post') {
      this.audio.postClang();
      this.audio.crowdGroan();
      this.effects.shake(0.2, 0.3);
      const dir = new THREE.Vector3((Math.random() - 0.5) * 2, 0.3, -0.6).normalize();
      this._rebound = new ReboundBounce(point, dir, 3);
    } else {
      this.audio.whoosh(0.2);
      this.audio.crowdGroan();
      this.effects.spawnIceSpray(point, 6);
    }
  }

  _finish() {
    this.phase = 'result';
    this._resultTimer = 0;
    this.effects.hideTrail();
    const goal = this._outcome.result === 'goal';
    const special = this._resolveData.special || this._outcome.special || null;
    const payload = {
      goal, save: this._outcome.result === 'save', post: this._outcome.result === 'post',
      miss: this._outcome.result === 'miss',
      shotType: this._resolveData.shotType,
      zone: this._resolveData.zone,
      special,
      quality: this._resolveData.quality,
      timeToRelease: this._resolveData.timeToRelease,
      beatBySpeed: !!this._outcome.beatBySpeed,
    };
    if (this.onResult) this.onResult(payload);
  }

  isDone() { return this.phase === 'done'; }
}
