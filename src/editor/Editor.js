// Basic modular level editor. New placeable object types can be added by
// appending to TOOLS — nothing else needs to change, per the "editor should
// be modular so more objects can be added later" requirement.

import { el, clear } from '../ui/dom.js';
import { themeFromHue } from '../core/Utils.js';
import * as O from '../level/Objects.js';

const GRID = 20;
const GROUND_Y = 500;

export const TOOLS = [
  { id: 'block', label: 'Block', hint: 'Solid platform' },
  { id: 'spike', label: 'Spike', hint: 'Ground hazard' },
  { id: 'spikeCeil', label: 'Ceiling Spike', hint: 'Hangs from above' },
  { id: 'saw', label: 'Saw', hint: 'Round hazard' },
  { id: 'pad', label: 'Jump Pad', hint: 'Launches player up' },
  { id: 'ring', label: 'Jump Ring', hint: 'Tap while touching' },
  { id: 'portalGravity', label: 'Gravity Portal', hint: 'Flips gravity' },
  { id: 'portalShip', label: 'Ship Portal', hint: 'Switch to Glider' },
  { id: 'portalCube', label: 'Cube Portal', hint: 'Switch to Runner' },
  { id: 'movingPlatform', label: 'Moving Platform', hint: 'Oscillates' },
  { id: 'disappearingPlatform', label: 'Disappearing Platform', hint: 'Blinks on/off' },
  { id: 'coin', label: 'Coin', hint: 'Collectible' },
  { id: 'checkpoint', label: 'Checkpoint', hint: 'Respawn point' },
  { id: 'eraser', label: 'Eraser', hint: 'Remove nearest object' },
];

function snap(v) { return Math.round(v / GRID) * GRID; }

export class Editor {
  constructor(game) {
    this.game = game;
    this.tool = 'block';
    this.scrollX = 0;
    this.state = this._blank();
    this.selectedId = null;
  }

  _blank() {
    return {
      name: 'Untitled Level', hue: 200, musicTrack: 'driftwave',
      solids: [], hazards: [], pads: [], rings: [], portals: [], coins: [], checkpoints: [],
    };
  }

  loadExisting(customLevel) {
    this.state = JSON.parse(JSON.stringify(customLevel));
  }

  newLevel() { this.state = this._blank(); this.scrollX = 0; }

  mount() {
    this.hudRoot = document.getElementById('hud');
    clear(this.hudRoot);
    this._buildToolbar();
    this._buildPropsPanel();
    this.game.canvas.addEventListener('click', this._onClick);
    window.addEventListener('keydown', this._onKey);
  }

  unmount() {
    clear(this.hudRoot);
    this.game.canvas.removeEventListener('click', this._onClick);
    window.removeEventListener('keydown', this._onKey);
  }

  _onKey = (e) => {
    if (e.code === 'ArrowRight') this.scrollX += 200;
    if (e.code === 'ArrowLeft') this.scrollX = Math.max(0, this.scrollX - 200);
  };

  _onClick = (e) => {
    if (e.target !== this.game.canvas) return;
    const rect = this.game.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const worldX = snap(this.scrollX + sx);
    const worldY = snap(sy);
    this._place(worldX, worldY);
  };

  _place(x, y) {
    const s = this.state;
    switch (this.tool) {
      case 'block': s.solids.push({ ...O.block(x, y + 40, 60, 40) }); break;
      case 'spike': s.hazards.push({ ...O.spike(x, GROUND_Y, {}) }); break;
      case 'spikeCeil': s.hazards.push({ ...O.spike(x, GROUND_Y, { ceiling: true, y }) }); break;
      case 'saw': s.hazards.push({ ...O.saw(x, y) }); break;
      case 'pad': s.pads.push({ ...O.pad(x, y + 16) }); break;
      case 'ring': s.rings.push({ ...O.ring(x, y) }); break;
      case 'portalGravity': s.portals.push({ ...O.portal(x, y, 200, { gravity: -1, form: 'orb' }, { label: 'GRAVITY' }) }); break;
      case 'portalShip': s.portals.push({ ...O.portal(x, y, 200, { form: 'glider' }, { label: 'SHIP' }) }); break;
      case 'portalCube': s.portals.push({ ...O.portal(x, y, 200, { form: 'runner', gravity: 1 }, { label: 'CUBE' }) }); break;
      case 'movingPlatform': s.solids.push({ ...O.movingPlatform(x, y + 10, 70, 20, { axis: 'y', amplitude: 60, speed: 1.3 }) }); break;
      case 'disappearingPlatform': s.solids.push({ ...O.disappearingPlatform(x, y + 10, 64, 20, { onTime: 1.2, offTime: 0.8 }) }); break;
      case 'coin': s.coins.push({ ...O.coin(x, y) }); break;
      case 'checkpoint': s.checkpoints.push(x); break;
      case 'eraser': this._eraseNear(x, y); break;
    }
    this._refreshProps();
  }

  _eraseNear(x, y) {
    const s = this.state;
    const near = (o) => Math.hypot((o.x ?? 0) - x, (o.y ?? GROUND_Y) - y) < 40;
    for (const key of ['solids', 'hazards', 'pads', 'rings', 'portals', 'coins']) {
      const idx = s[key].findIndex(near);
      if (idx >= 0) { s[key].splice(idx, 1); return; }
    }
    const cpIdx = s.checkpoints.findIndex((cx) => Math.abs(cx - x) < 40);
    if (cpIdx >= 0) s.checkpoints.splice(cpIdx, 1);
  }

  _buildToolbar() {
    const bar = el('div', { id: 'editor-toolbar' }, [
      el('button', { class: 'btn small', onClick: () => this.game.exitEditor() }, ['✕ Exit Editor']),
      el('h3', { class: 'title-font', style: 'font-size:0.95rem; margin:14px 0 6px;' }, ['Tools']),
    ]);
    for (const t of TOOLS) {
      bar.appendChild(el('button', {
        class: `btn small${this.tool === t.id ? ' primary' : ''}`,
        title: t.hint,
        onClick: () => { this.tool = t.id; this._buildToolbar(); },
      }, [t.label]));
    }
    bar.appendChild(el('div', { class: 'row', style: 'margin-top:14px;' }, [
      el('button', { class: 'btn small', onClick: () => { this.scrollX = Math.max(0, this.scrollX - 300); } }, ['◀ Scroll']),
      el('button', { class: 'btn small', onClick: () => { this.scrollX += 300; } }, ['Scroll ▶']),
    ]));
    const old = this.hudRoot.querySelector('#editor-toolbar');
    if (old) old.remove();
    this.hudRoot.appendChild(bar);
  }

  _buildPropsPanel() {
    const s = this.state;
    const panel = el('div', { id: 'editor-props' }, [
      el('h3', { class: 'title-font', style: 'font-size:0.95rem;' }, ['Level Settings']),
      labeled('Name', el('input', { type: 'text', value: s.name, oninput: (e) => { s.name = e.target.value; } })),
      labeled('Theme Hue', el('input', { type: 'range', min: 0, max: 360, value: s.hue, oninput: (e) => { s.hue = +e.target.value; this._buildPropsPanel(); } })),
      labeled('Music', musicSelect(s, () => this._buildPropsPanel())),
      el('div', { class: 'row', style: 'margin: 12px 0; gap:8px;' }, [
        el('button', { class: 'btn small primary', onClick: () => this.game.testPlayEditorLevel() }, ['▶ Test']),
        el('button', { class: 'btn small', onClick: () => this.game.saveEditorLevel() }, ['💾 Save']),
      ]),
      el('button', { class: 'btn small danger', onClick: () => { if (confirm('Clear the whole level?')) { this.newLevel(); this._buildToolbar(); this._buildPropsPanel(); } } }, ['Clear Level']),
      el('div', { class: 'small-text', style: 'margin-top:16px;' }, [
        `Objects: ${s.solids.length + s.hazards.length + s.pads.length + s.rings.length + s.portals.length + s.coins.length}`,
      ]),
      el('div', { class: 'small-text' }, [`Checkpoints: ${s.checkpoints.length}`]),
      el('div', { class: 'hint' }, ['Click the canvas to place the selected tool. Arrow keys or Scroll buttons pan the level.']),
    ]);
    const old = this.hudRoot.querySelector('#editor-props');
    if (old) old.remove();
    this.hudRoot.appendChild(panel);
  }

  _refreshProps() {
    const countEl = this.hudRoot.querySelector('#editor-props .small-text');
    if (countEl) this._buildPropsPanel();
  }

  buildLevelData() {
    const s = this.state;
    const maxX = Math.max(400, ...[...s.solids, ...s.hazards, ...s.pads, ...s.rings, ...s.portals, ...s.coins].map((o) => o.x || 0), ...s.checkpoints) + 400;
    return {
      id: `custom_${Date.now()}`, name: s.name || 'Untitled Level', difficulty: 5, category: 'Custom',
      musicTrack: s.musicTrack, theme: themeFromHue(s.hue, s.name), length: maxX, groundY: GROUND_Y, killY: 900,
      startForm: 'runner',
      solids: [O.ground(0, maxX, GROUND_Y), ...s.solids.map((o) => ({ ...o }))],
      hazards: s.hazards.map((o) => ({ ...o })), pads: s.pads.map((o) => ({ ...o })), rings: s.rings.map((o) => ({ ...o })),
      portals: s.portals.map((o) => ({ ...o })), coins: s.coins.map((o) => ({ ...o })),
      checkpoints: [...s.checkpoints],
      end: O.endFlag(maxX - 100, GROUND_Y),
    };
  }

  render(renderer, t) {
    renderer.clear();
    renderer.drawBackground(themeFromHue(this.state.hue, this.state.name), this.scrollX, GROUND_Y, t);
    const ctx = renderer.ctx;
    ctx.save();
    ctx.translate(-this.scrollX, 0);
    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let x = Math.floor(this.scrollX / 100) * 100; x < this.scrollX + renderer.width + 100; x += 100) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, renderer.height); ctx.stroke();
    }
    renderer.glowRect(-9999, GROUND_Y, 30000, 4, 'rgba(255,255,255,0.3)', 6);
    for (const o of this.state.solids) renderer.glowRect(o.x, o.y, o.w, o.h, '#7a5cff', 8);
    for (const o of this.state.hazards) renderer.glowCircle(o.x, o.y ?? GROUND_Y - 17, o.r || 17, '#ff3b6b', 10);
    for (const o of this.state.pads) renderer.glowRect(o.x, o.y, o.w, o.h, '#ffd23b', 10);
    for (const o of this.state.rings) renderer.glowCircle(o.x, o.y, o.r, '#37f0ff', 12);
    for (const o of this.state.portals) renderer.glowRect(o.x, o.y, o.w, o.h, '#ff37a4', 12);
    for (const o of this.state.coins) renderer.glowCircle(o.x, o.y, o.r, '#ffd23b', 10);
    for (const cx of this.state.checkpoints) renderer.glowRect(cx - 3, GROUND_Y - 120, 6, 120, '#37ff8f', 10);
    ctx.restore();
  }
}

function labeled(text, input) {
  return el('label', { class: 'field' }, [text, input]);
}

function musicSelect(s, onChange) {
  const opts = ['driftwave', 'circuitrun', 'ionstorm', 'glassecho', 'emberpulse', 'voidcascade', 'auroraline', 'neonfracture'];
  const sel = el('select', {});
  for (const o of opts) sel.appendChild(el('option', { value: o, selected: o === s.musicTrack }, [o]));
  sel.addEventListener('change', (e) => { s.musicTrack = e.target.value; onChange(); });
  return sel;
}
