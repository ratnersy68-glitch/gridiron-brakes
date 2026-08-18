// Unifies keyboard, mouse and touch input into a single "isPressed" pulse
// stream the player controller consumes each frame.

export class InputManager {
  constructor(target) {
    this.target = target;
    this.pressed = false;   // currently held
    this.justPressed = false;
    this.justReleased = false;
    this._keybinds = { jump: 'Space', altJump: 'ArrowUp' };
    this._bind();
  }

  setKeybinds(kb) { this._keybinds = { ...this._keybinds, ...kb }; }

  _isJumpKey(code) {
    return code === this._keybinds.jump || code === this._keybinds.altJump || code === 'ArrowUp';
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      if (this._isJumpKey(e.code) || e.code === 'Space') {
        if (!this.pressed) this.justPressed = true;
        this.pressed = true;
        e.preventDefault();
      }
      if (e.code === 'Escape') window.dispatchEvent(new CustomEvent('game:pause-toggle'));
    });
    window.addEventListener('keyup', (e) => {
      if (this._isJumpKey(e.code) || e.code === 'Space') {
        this.justReleased = true;
        this.pressed = false;
      }
    });
    const down = (e) => { if (!this.pressed) this.justPressed = true; this.pressed = true; e.preventDefault(); };
    const up = (e) => { this.justReleased = true; this.pressed = false; };
    this.target.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    this.target.addEventListener('touchstart', down, { passive: false });
    window.addEventListener('touchend', up);
  }

  // Call once per frame after gameplay reads the flags.
  endFrame() {
    this.justPressed = false;
    this.justReleased = false;
  }
}
