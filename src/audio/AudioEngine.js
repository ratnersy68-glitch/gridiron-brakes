// All music/SFX is synthesised at runtime with the WebAudio API — no
// external audio assets, so everything heard is original to this game.
// Each level declares a `musicTrack` (key into TRACKS below); the engine
// schedules a looping procedural sequence and emits 'beat' events on the
// EventBus so gameplay/visuals can sync to it.

import { EventBus } from '../core/Utils.js';

const SCALES = {
  minorPent: [0, 3, 5, 7, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  wholeTone: [0, 2, 4, 6, 8, 10],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

// Track "recipes" — each level picks one by id, giving every difficulty
// tier a distinct original sonic identity (tempo, scale, timbre, root).
export const TRACKS = {
  driftwave:   { bpm: 96,  scale: 'major',     root: 220, wave: 'triangle', bass: 'sine' },
  circuitrun:  { bpm: 128, scale: 'minorPent', root: 196, wave: 'square',   bass: 'sawtooth' },
  ionstorm:    { bpm: 140, scale: 'phrygian',  root: 174, wave: 'sawtooth', bass: 'square' },
  glassecho:   { bpm: 110, scale: 'wholeTone', root: 246, wave: 'sine',     bass: 'triangle' },
  emberpulse:  { bpm: 150, scale: 'minor',     root: 164, wave: 'sawtooth', bass: 'sawtooth' },
  voidcascade: { bpm: 160, scale: 'phrygian',  root: 146, wave: 'square',   bass: 'square' },
  auroraline:  { bpm: 102, scale: 'major',     root: 261, wave: 'triangle', bass: 'sine' },
  neonfracture:{ bpm: 172, scale: 'minorPent', root: 130, wave: 'sawtooth', bass: 'sawtooth' },
};

export class AudioEngine {
  constructor(saveSystem) {
    this.save = saveSystem;
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.currentTrackId = null;
    this.beatIndex = 0;
    this.nextNoteTime = 0;
    this.scheduleTimer = null;
    this.bpm = 120;
    this.running = false;
    this.rngState = 1;
  }

  _ensureCtx() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.ctx.destination);
    this.applyVolumes();
  }

  applyVolumes() {
    if (!this.ctx) return;
    const s = this.save.data.settings;
    this.musicGain.gain.setTargetAtTime(s.musicVolume, this.ctx.currentTime, 0.05);
    this.sfxGain.gain.setTargetAtTime(s.sfxVolume, this.ctx.currentTime, 0.05);
  }

  resume() { this._ensureCtx(); if (this.ctx.state === 'suspended') this.ctx.resume(); }

  // deterministic-ish pseudo random per track so a level always sounds the same
  _rand() {
    this.rngState = (this.rngState * 1103515245 + 12345) & 0x7fffffff;
    return this.rngState / 0x7fffffff;
  }

  playTrack(trackId, seed = 1) {
    this._ensureCtx();
    this.resume();
    this.stopTrack();
    const rec = TRACKS[trackId] || TRACKS.driftwave;
    this.currentTrackId = trackId;
    this.rngState = (seed * 9973) % 0x7fffffff || 1;
    this.bpm = rec.bpm;
    this.beatIndex = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.running = true;
    this._rec = rec;
    this._scheduleLoop();
  }

  stopTrack() {
    this.running = false;
    if (this.scheduleTimer) clearInterval(this.scheduleTimer);
    this.scheduleTimer = null;
    this.currentTrackId = null;
  }

  _scheduleLoop() {
    const lookAhead = 0.12;
    this.scheduleTimer = setInterval(() => {
      if (!this.running) return;
      while (this.nextNoteTime < this.ctx.currentTime + lookAhead) {
        this._scheduleBeat(this.beatIndex, this.nextNoteTime);
        const secondsPerBeat = 60 / this.bpm / 2; // 8th-note grid
        this.nextNoteTime += secondsPerBeat;
        this.beatIndex++;
      }
    }, 25);
  }

  _scheduleBeat(index, time) {
    const rec = this._rec;
    const scale = SCALES[rec.scale];
    const step = index % 16;
    // Kick/bass on strong beats
    if (step % 4 === 0) this._blip(rec.root / 2, rec.bass, time, 0.18, 0.5);
    // Hats on off-beats
    if (step % 2 === 1) this._noise(time, 0.03, 0.12);
    // Melody
    const degree = scale[Math.floor(this._rand() * scale.length)];
    const octave = step % 8 < 4 ? 1 : 2;
    const freq = rec.root * Math.pow(2, degree / 12) * octave;
    if (this._rand() > 0.35) this._blip(freq, rec.wave, time, 0.14, 0.22);

    if (step === 0) EventBus.emit('audio:beat-strong', { time });
    else EventBus.emit('audio:beat', { time, step });
    if (step === 0 && (index / 16) % 4 === 0) EventBus.emit('audio:phrase', { time });
  }

  _blip(freq, type, time, dur, gainVal) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  _noise(time, dur, gainVal) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    src.connect(gain);
    gain.connect(this.musicGain);
    src.start(time);
  }

  // --- One-shot SFX ---
  sfx(name) {
    this._ensureCtx();
    const t = this.ctx.currentTime;
    switch (name) {
      case 'jump': this._sweep(420, 720, t, 0.1, 'square', 0.25); break;
      case 'death': this._sweep(300, 40, t, 0.35, 'sawtooth', 0.35); this._noise(t, 0.25, 0.3); break;
      case 'coin': this._sweep(700, 1400, t, 0.12, 'sine', 0.3); break;
      case 'pad': this._sweep(200, 900, t, 0.15, 'triangle', 0.3); break;
      case 'ring': this._sweep(500, 1100, t, 0.08, 'square', 0.28); break;
      case 'portal': this._sweep(150, 1200, t, 0.25, 'sawtooth', 0.22); break;
      case 'checkpoint': this._sweep(500, 800, t, 0.1, 'sine', 0.22); break;
      case 'complete': this._fanfare(t); break;
      case 'click': this._sweep(600, 750, t, 0.05, 'square', 0.18); break;
      default: break;
    }
  }

  _sweep(f1, f2, time, dur, type, gainVal) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, time);
    osc.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), time + dur);
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  _fanfare(t) {
    [0, 4, 7, 12].forEach((semi, i) => {
      this._blipSfx(440 * Math.pow(2, semi / 12), t + i * 0.09, 0.3);
    });
  }

  _blipSfx(freq, time, dur) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }
}
