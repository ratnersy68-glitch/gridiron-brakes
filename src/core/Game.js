import { SaveSystem } from './SaveSystem.js';
import { InputManager } from './InputManager.js';
import { EventBus } from './Utils.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { Renderer } from '../render/Renderer.js';
import { ParticleSystem } from '../render/ParticleSystem.js';
import { drawLevel, drawPlayer } from '../render/LevelRenderer.js';
import { LevelRuntime } from '../level/LevelRuntime.js';
import { generateLevel } from '../levels/generator.js';
import { getLevelMeta, LEVEL_META } from '../levels/levelList.js';
import { getDailyLevel, todayKey } from '../levels/daily.js';
import { Progression } from '../progression/Progression.js';
import { Statistics } from '../stats/Statistics.js';
import { Achievements } from '../achievements/Achievements.js';
import { getColorHex } from '../progression/Cosmetics.js';
import { UIManager } from '../ui/UIManager.js';
import { HUD, buildPauseOverlay, buildCompleteOverlay } from '../ui/screens/HUD.js';
import { Editor } from '../editor/Editor.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.hudRoot = document.getElementById('hud');
    this.deathFlashEl = document.getElementById('death-flash');

    this.save = new SaveSystem();
    this.audio = new AudioEngine(this.save);
    this.input = new InputManager(this.canvas);
    this.renderer = new Renderer(this.canvas);
    this.renderer.quality = this.save.data.settings.graphicsQuality;
    this.particles = new ParticleSystem();
    this.particles.enabled = this.save.data.settings.particles;

    this.statistics = new Statistics(this.save);
    this.progression = new Progression(this.save);
    this.achievements = new Achievements(this.save);

    this.ui = new UIManager(document.getElementById('ui-root'), this);
    this.hud = new HUD(this.hudRoot, this);
    this.editor = new Editor(this);

    this.state = 'menu';
    this.runtime = null;
    this.currentMeta = null;
    this.currentLevelId = null;
    this.paused = false;
    this.overlayEl = null;
    this._prevWorldX = 0;
    this.lastTime = performance.now();

    this._bindEvents();
    this.ui.showScreen('mainMenu');
    requestAnimationFrame(this._loop);
  }

  _bindEvents() {
    EventBus.on('level:death', (e) => this._onDeath(e));
    EventBus.on('level:coin', () => this.audio.sfx('coin'));
    EventBus.on('level:pad', () => this.audio.sfx('pad'));
    EventBus.on('level:ring', () => this.audio.sfx('ring'));
    EventBus.on('level:portal', (e) => { this.audio.sfx('portal'); this.renderer.addPulse(1); this._burst(e.x, e.y, '#ff37a4', 14); });
    EventBus.on('level:jump', () => this.audio.sfx('jump'));
    EventBus.on('level:complete', (e) => this._onComplete(e));
    EventBus.on('level:attempt-start', ({ levelId }) => {
      if (typeof levelId === 'number') { const p = this.save.getLevelProgress(levelId); p.attempts++; this.save.save(); }
    });
    EventBus.on('achievement:unlocked', (e) => this.ui.toast(`🏆 Achievement: ${e.name}`));
    EventBus.on('progression:reward', (r) => { this._lastReward = r; });
    EventBus.on('audio:beat-strong', () => this.renderer.addPulse(0.5));
    window.addEventListener('game:pause-toggle', () => { if (this.state === 'gameplay') this.togglePause(); });
  }

  // --- level lifecycle -----------------------------------------------
  startLevel(id, opts = {}) {
    this.audio.resume();
    let level;
    if (id === 'daily') level = getDailyLevel(todayKey());
    else level = generateLevel(id);

    this.currentLevelId = id;
    this.currentMeta = typeof id === 'number' ? getLevelMeta(id) : null;
    this.runtime = new LevelRuntime(level, { practiceMode: !!opts.practice });
    this._prevWorldX = 0;
    this.paused = false;
    this._editorReturn = false;
    this._clearOverlay();
    this.ui.hide();
    this.state = 'gameplay';
    this.hud.mount(this.runtime);
    this.audio.playTrack(level.musicTrack, typeof level.id === 'number' ? level.id : 7);
    if (opts.practice) EventBus.emit('practice:session', {});
  }

  startDaily() { this.startLevel('daily'); }

  startNextIncomplete() {
    const next = LEVEL_META.find((l) => !this.save.getLevelProgress(l.id).completed);
    this.startLevel(next ? next.id : 1);
  }

  restartLevel() {
    this._clearOverlay();
    this.startLevel(this.currentLevelId, { practice: this.runtime?.practiceMode });
  }

  hasNextLevel() { return typeof this.currentLevelId === 'number' && !!getLevelMeta(this.currentLevelId + 1); }
  nextLevelId() { return this.currentLevelId + 1; }

  exitToMenu() {
    this._saveProgressSnapshot();
    this.audio.stopTrack();
    this.state = 'menu';
    this.runtime = null;
    this._clearOverlay();
    this.hud.unmount();
    this.renderer.ctx.clearRect(0, 0, this.renderer.width, this.renderer.height);
    this.ui.showScreen('mainMenu');
  }

  togglePause() {
    if (this.state !== 'gameplay') return;
    this.paused = !this.paused;
    if (this.paused) {
      this.overlayEl = buildPauseOverlay(this, this.runtime);
      document.getElementById('app').appendChild(this.overlayEl);
    } else {
      this._clearOverlay();
    }
  }

  _clearOverlay() { if (this.overlayEl) { this.overlayEl.remove(); this.overlayEl = null; } }

  _saveProgressSnapshot() {
    if (!this.runtime || typeof this.currentLevelId !== 'number') return;
    const p = this.save.getLevelProgress(this.currentLevelId);
    p.bestPercent = Math.max(p.bestPercent, this.runtime.bestPercentThisSession);
    p.deaths += this.runtime.deaths;
    this.save.save();
  }

  _onDeath({ x, y }) {
    const s = this.save.data.settings;
    this._burst(x, y, getColorHex(this.save, this.save.data.equipped.color), 26);
    if (s.screenShake) this.renderer.addShake(14);
    if (!s.reduceFlash) { this.deathFlashEl.classList.remove('show'); void this.deathFlashEl.offsetWidth; this.deathFlashEl.classList.add('show'); }
    this.audio.sfx('death');
    this._saveProgressSnapshot();
  }

  _onComplete(payload) {
    this.audio.sfx('complete');
    this.audio.stopTrack();
    if (typeof this.currentLevelId === 'number' && !payload.practiceMode) {
      const p = this.save.getLevelProgress(this.currentLevelId);
      p.completed = true;
      p.bestPercent = 100;
      p.bestTimeMs = p.bestTimeMs === null ? payload.timeMs : Math.min(p.bestTimeMs, payload.timeMs);
      this.runtime.level.coins.forEach((c, i) => { p.coins[i] = p.coins[i] || !!c.collected; });
      this.save.save();
    }
    if (this.currentLevelId === 'daily' && !payload.practiceMode) {
      const dc = this.save.data.dailyChallenge;
      const today = todayKey();
      if (dc.lastCompletedDate !== today) {
        const yesterday = todayKey(new Date(Date.now() - 86400000));
        dc.streak = dc.lastCompletedDate === yesterday ? dc.streak + 1 : 1;
        dc.lastCompletedDate = today;
        this.save.save();
        EventBus.emit('daily:complete', {});
      }
    }
    const reward = payload.practiceMode ? null : (this._lastReward || null);
    this._lastReward = null;
    this.overlayEl = buildCompleteOverlay(this, { ...payload, reward });
    document.getElementById('app').appendChild(this.overlayEl);
    this.hud.unmount();
  }

  _burst(x, y, color, count) { if (this.save.data.settings.particles) this.particles.burst(x, y, color, count); }

  // --- editor ----------------------------------------------------------
  openEditor() {
    this.audio.stopTrack();
    this.state = 'editor';
    this.ui.hide();
    this.hud.unmount();
    this.editor.mount();
  }

  exitEditor() { this.editor.unmount(); this.state = 'menu'; this.ui.showScreen('mainMenu'); }

  returnToEditorFromTest() {
    this._clearOverlay();
    this.audio.stopTrack();
    this.hud.unmount();
    this.runtime = null;
    this.state = 'editor';
    this.editor.mount();
  }

  testPlayEditorLevel() {
    const level = this.editor.buildLevelData();
    this.editor.unmount();
    this.currentLevelId = level.id;
    this.currentMeta = null;
    this.runtime = new LevelRuntime(level, { practiceMode: true });
    this.runtime.level.checkpoints?.forEach((cx) => {
      this.runtime.checkpoints.push({ worldX: cx, y: level.groundY - 30, form: 'runner', gravityDir: 1, speedMult: 1, mini: false, elapsed: 0, coinState: level.coins.map(() => false) });
    });
    this._prevWorldX = 0;
    this.paused = false;
    this._editorReturn = true;
    this._clearOverlay();
    this.state = 'gameplay';
    this.hud.mount(this.runtime);
    this.audio.resume();
    this.audio.playTrack(level.musicTrack, 3);
  }

  saveEditorLevel() {
    const level = this.editor.buildLevelData();
    this.save.data.editorLevels.push(level);
    this.save.save();
    EventBus.emit('editor:save', {});
    this.ui.toast(`Saved "${level.name}"`);
  }

  // --- main loop ---------------------------------------------------------
  _loop = (now) => {
    const dt = Math.min((now - this.lastTime) / 1000, 1 / 30);
    this.lastTime = now;
    const t = now / 1000;

    if (this.state === 'gameplay' && !this.paused) {
      this._stepGameplay(dt, t);
    } else if (this.state === 'editor') {
      this.editor.render(this.renderer, t);
    }

    this.input.endFrame();
    requestAnimationFrame(this._loop);
  };

  _stepGameplay(dt, t) {
    const r = this.runtime;
    r.update(dt, this.input);
    this.particles.update(dt);

    const colorHex = getColorHex(this.save, this.save.data.equipped.color);
    if (r.player.alive && Math.random() < 0.6) this.particles.trail(r.player.worldX - r.player.halfSize * 0.6, r.player.y, colorHex, 3);

    this.renderer.beginFrame(dt);
    this.renderer.clear();
    drawLevel(this.renderer, r.level, r.camX, r.elapsed);
    if (r.player.alive) drawPlayer(this.renderer, r.player, colorHex, r.camX);
    this.particles.render(this.renderer.ctx, r.camX);
    this.renderer.endFrame();

    this.hud.update(r);

    const delta = Math.max(0, r.player.worldX - this._prevWorldX);
    this._prevWorldX = r.player.worldX;
    this.statistics.tick(dt, delta);
  }
}
