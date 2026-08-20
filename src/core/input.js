import { SHOT_ORDER } from '../data/shots.js';

// Unified input: mouse, touch (via Pointer Events, which cover both) plus
// keyboard shortcuts and Gamepad API polling. Produces a single clean state
// the attempt controller reads each frame — it never touches raw DOM events.
export class InputManager {
  constructor(target) {
    this.target = target;
    this.aim = { x: 0, y: 0 }; // -1..1, 0,0 = center of net
    this.charging = false;
    this.chargeStartTime = 0;
    this.chargeStartPos = { x: 0, y: 0 };
    this.dekeAmount = 0; // -1..1
    this.shotType = 'wrist';
    this.enabled = false;
    this.invertY = false;
    // True when style.css's forced-landscape rotation is active (portrait
    // phone, content rotated 90deg via CSS). Real pointer coordinates then
    // need to be rotated back into the game's own coordinate frame.
    this.rotatedLandscape = false;
    this.gamepadIndex = null;
    this._keyDeke = 0;

    this.onChargeStart = null;
    this.onChargeEnd = null; // (duration, dekeAmount)
    this.onShotTypeChange = null;
    this.onSpecialTrigger = null; // spin move / Michigan attempt

    this._bind();
  }

  _bind() {
    const t = this.target;
    t.addEventListener('pointerdown', (e) => this._pointerDown(e));
    window.addEventListener('pointermove', (e) => this._pointerMove(e));
    window.addEventListener('pointerup', (e) => this._pointerUp(e));
    window.addEventListener('keydown', (e) => this._keyDown(e));
    window.addEventListener('keyup', (e) => this._keyUp(e));
    window.addEventListener('gamepadconnected', (e) => { this.gamepadIndex = e.gamepad.index; });
    window.addEventListener('gamepaddisconnected', () => { this.gamepadIndex = null; });
  }

  setEnabled(v) { this.enabled = v; if (!v) { this.charging = false; } }

  // Converts real screen-space clientX/clientY into the game's own axes,
  // accounting for the CSS rotate(-90deg) forced-landscape mode (see
  // style.css). Inverse of that transform: game_x = innerHeight - clientY,
  // game_y = clientX.
  _toGameSpace(clientX, clientY) {
    if (this.rotatedLandscape) {
      const gameW = window.innerHeight;
      const gameH = window.innerWidth;
      const gx = window.innerHeight - clientY;
      const gy = clientX;
      return { x: gx, y: gy, w: gameW, h: gameH };
    }
    const rect = this.target.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top, w: rect.width, h: rect.height };
  }

  _updateAimFromClient(clientX, clientY) {
    const g = this._toGameSpace(clientX, clientY);
    const x = (g.x / g.w) * 2 - 1;
    let y = -((g.y / g.h) * 2 - 1);
    if (this.invertY) y = -y;
    this.aim.x = Math.max(-1, Math.min(1, x));
    this.aim.y = Math.max(-1, Math.min(1, y));
  }

  _pointerDown(e) {
    if (!this.enabled) return;
    this._updateAimFromClient(e.clientX, e.clientY);
    this.charging = true;
    this.chargeStartTime = performance.now();
    this.chargeStartPos = { x: e.clientX, y: e.clientY };
    this.dekeAmount = 0;
    if (this.onChargeStart) this.onChargeStart();
  }

  _pointerMove(e) {
    if (!this.enabled) return;
    this._updateAimFromClient(e.clientX, e.clientY);
    if (this.charging) {
      // Screen-space delta maps to game-space delta (-dyScreen, dxScreen)
      // under the rotate(-90deg) forced-landscape transform.
      const dxScreen = e.clientX - this.chargeStartPos.x;
      const dyScreen = e.clientY - this.chargeStartPos.y;
      const dxGame = this.rotatedLandscape ? -dyScreen : dxScreen;
      const gameWidth = this.rotatedLandscape ? window.innerHeight : this.target.getBoundingClientRect().width;
      this.dekeAmount = Math.max(-1, Math.min(1, dxGame / (gameWidth * 0.35)));
    }
  }

  _pointerUp(e) {
    if (!this.enabled || !this.charging) return;
    this.charging = false;
    const duration = (performance.now() - this.chargeStartTime) / 1000;
    if (this.onChargeEnd) this.onChargeEnd(duration, this.dekeAmount);
  }

  _keyDown(e) {
    if (e.repeat) return;
    const idx = SHOT_ORDER.findIndex((s, i) => `${i + 1}` === e.key);
    if (idx >= 0) {
      this.shotType = SHOT_ORDER[idx];
      if (this.onShotTypeChange) this.onShotTypeChange(this.shotType);
    }
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this._keyDeke = -1;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') this._keyDeke = 1;
    if (e.code === 'Space') {
      e.preventDefault();
      if (this.enabled && this.onSpecialTrigger) this.onSpecialTrigger();
    }
  }

  _keyUp(e) {
    if ((e.code === 'KeyA' || e.code === 'ArrowLeft') && this._keyDeke === -1) this._keyDeke = 0;
    if ((e.code === 'KeyD' || e.code === 'ArrowRight') && this._keyDeke === 1) this._keyDeke = 0;
  }

  setShotType(id) {
    this.shotType = id;
    if (this.onShotTypeChange) this.onShotTypeChange(id);
  }

  triggerSpecial() {
    if (this.enabled && this.onSpecialTrigger) this.onSpecialTrigger();
  }

  // Called once per frame from the main loop.
  pollGamepad() {
    if (this.gamepadIndex === null) return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads[this.gamepadIndex];
    if (!gp) return;
    const lx = gp.axes[0] || 0;
    const ly = gp.axes[1] || 0;
    if (Math.abs(lx) > 0.08 || Math.abs(ly) > 0.08) {
      const yDir = this.invertY ? 1 : -1;
      this.aim.x = Math.max(-1, Math.min(1, this.aim.x + lx * 0.04));
      this.aim.y = Math.max(-1, Math.min(1, this.aim.y + ly * 0.04 * yDir));
    }
    const rt = gp.buttons[7] ? gp.buttons[7].value : 0; // right trigger = charge
    const rtPressed = rt > 0.15;
    if (rtPressed && !this.charging && this.enabled) {
      this.charging = true;
      this.chargeStartTime = performance.now();
      this.dekeAmount = 0;
      if (this.onChargeStart) this.onChargeStart();
    } else if (!rtPressed && this.charging && this._gamepadWasCharging) {
      this.charging = false;
      const duration = (performance.now() - this.chargeStartTime) / 1000;
      if (this.onChargeEnd) this.onChargeEnd(duration, this.dekeAmount);
    }
    this._gamepadWasCharging = rtPressed;
    if (this.charging) {
      this.dekeAmount = Math.max(-1, Math.min(1, this.dekeAmount + lx * 0.05));
    }
    // face buttons pick shot type: A=wrist, X=snap, Y=slap, B=backhand
    if (gp.buttons[0] && gp.buttons[0].pressed) this.setShotType('wrist');
    if (gp.buttons[2] && gp.buttons[2].pressed) this.setShotType('snap');
    if (gp.buttons[3] && gp.buttons[3].pressed) this.setShotType('slap');
    if (gp.buttons[1] && gp.buttons[1].pressed) this.setShotType('backhand');
    if (gp.buttons[4] && gp.buttons[4].pressed && !this._lbWas) this.triggerSpecial();
    this._lbWas = gp.buttons[4] && gp.buttons[4].pressed;
  }

  // Merges keyboard hold-deke into dekeAmount while charging (keyboard players).
  applyKeyboardDeke(dt) {
    if (this.charging && this._keyDeke !== 0) {
      this.dekeAmount = Math.max(-1, Math.min(1, this.dekeAmount + this._keyDeke * dt * 1.6));
    }
  }
}
