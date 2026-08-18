import { Player, FORMS } from '../player/Player.js';
import { updateDynamics, resolvePlayer } from './CollisionSystem.js';
import { EventBus, clamp } from '../core/Utils.js';

const SCREEN_ANCHOR_X = 240;
const RESPAWN_DELAY = 0.42; // "nearly instant" restart

// Owns one attempt-at-a-level's worth of live simulation state: the player,
// elapsed time (which every time-driven hazard/platform is keyed to),
// checkpoints (practice mode), coin/percent tracking. Emits EventBus events
// for audio/render/progression layers to react to instead of importing them
// directly, keeping this module gameplay-only.
export class LevelRuntime {
  constructor(levelData, opts = {}) {
    this.level = levelData;
    this.practiceMode = !!opts.practiceMode;
    this.player = new Player();
    this.elapsed = 0;
    this.attempts = 0;
    this.deaths = 0;
    this.bestPercentThisSession = 0;
    this.percent = 0;
    this.dead = false;
    this.respawnTimer = 0;
    this.completed = false;
    this.checkpoints = []; // practice mode: { worldX, y, form, gravityDir, speedMult, mini, elapsed, coinState }
    this.checkpointsEnabled = true;
    this.speedScale = 1;
    this.paused = false;
    this.startTime = performance.now();
    this._resetRun(true);
  }

  _resetLevelObjectState() {
    for (const c of this.level.coins) c.collected = false;
    for (const p of this.level.portals) p._armed = true;
  }

  _resetRun(firstTime = false) {
    this.player.reset(0, this.level.groundY);
    this.player.setForm(this.level.startForm || FORMS.RUNNER);
    this.player.setGravity(1);
    this.player.setSpeedMult(1);
    this.player.setMini(false);
    this._resetLevelObjectState();
    this.elapsed = 0;
    this.percent = 0;
    this.dead = false;
    this.completed = false;
    if (!firstTime) this.attempts++;
    EventBus.emit('level:attempt-start', { levelId: this.level.id, attempts: this.attempts });
  }

  addCheckpoint() {
    if (!this.practiceMode) return;
    this.checkpoints.push({
      worldX: this.player.worldX, y: this.player.y, form: this.player.form,
      gravityDir: this.player.gravityDir, speedMult: this.player.speedMult, mini: this.player.mini,
      elapsed: this.elapsed, coinState: this.level.coins.map((c) => c.collected),
    });
    EventBus.emit('practice:checkpoint-added', { count: this.checkpoints.length });
  }

  clearCheckpoints() { this.checkpoints = []; }
  setCheckpointsEnabled(v) { this.checkpointsEnabled = v; }
  setSpeedScale(s) { this.speedScale = s; }

  _respawnFromCheckpoint() {
    const cp = this.checkpoints[this.checkpoints.length - 1];
    this.player.reset(cp.worldX, this.level.groundY);
    this.player.y = cp.y;
    this.player.setForm(cp.form);
    this.player.setGravity(cp.gravityDir);
    this.player.setSpeedMult(cp.speedMult);
    this.player.setMini(cp.mini);
    this.elapsed = cp.elapsed;
    this.level.coins.forEach((c, i) => (c.collected = cp.coinState[i]));
    for (const p of this.level.portals) p._armed = true;
    this.dead = false;
    this.completed = false;
    this.attempts++;
    EventBus.emit('level:attempt-start', { levelId: this.level.id, attempts: this.attempts });
  }

  triggerDeath() {
    if (this.dead) return;
    this.dead = true;
    this.deaths++;
    this.player.kill();
    EventBus.emit('level:death', { levelId: this.level.id, x: this.player.worldX, y: this.player.y, deaths: this.deaths });
    this.respawnTimer = RESPAWN_DELAY;
  }

  update(dt, input) {
    if (this.paused || this.completed) return;
    const scaledDt = dt * this.speedScale;

    if (this.dead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        if (this.practiceMode && this.checkpointsEnabled && this.checkpoints.length > 0) this._respawnFromCheckpoint();
        else this._resetRun(false);
      }
      return;
    }

    this.elapsed += scaledDt;
    updateDynamics(this.level, this.elapsed);
    this.player.update(scaledDt, input, this.level.groundY, -9999);
    const result = resolvePlayer(this.level, this.player, input, scaledDt);

    for (const ev of result.events) {
      if (ev.type === 'coin') EventBus.emit('level:coin', { levelId: this.level.id, coin: ev.coin });
      else if (ev.type === 'pad') EventBus.emit('level:pad', { x: this.player.worldX, y: this.player.y });
      else if (ev.type === 'ring') EventBus.emit('level:ring', { x: this.player.worldX, y: this.player.y });
      else if (ev.type === 'portal') EventBus.emit('level:portal', { x: this.player.worldX, y: this.player.y, effect: ev.effect });
      else if (ev.type === 'complete') this._finish();
    }

    if (result.landed) EventBus.emit('level:land', { x: this.player.worldX, y: this.player.y });
    if (input.justPressed) EventBus.emit('level:jump', {});

    this.percent = clamp((this.player.worldX / this.level.length) * 100, 0, 100);
    this.bestPercentThisSession = Math.max(this.bestPercentThisSession, this.percent);

    if (result.dead) this.triggerDeath();
  }

  _finish() {
    this.completed = true;
    this.percent = 100;
    const coinsCollected = this.level.coins.filter((c) => c.collected).length;
    const timeMs = Math.round(this.elapsed * 1000);
    EventBus.emit('level:complete', {
      levelId: this.level.id, timeMs, deaths: this.deaths, attempts: this.attempts,
      coinsCollected, totalCoins: this.level.coins.length, practiceMode: this.practiceMode,
      difficulty: this.level.difficulty,
    });
  }

  get camX() { return this.player.worldX - SCREEN_ANCHOR_X; }
  get screenAnchorX() { return SCREEN_ANCHOR_X; }
}
