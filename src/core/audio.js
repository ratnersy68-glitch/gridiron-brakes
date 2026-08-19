// Fully procedural WebAudio sound engine. No external audio files, so
// everything is synthesized with oscillators/noise buffers — keeps the game
// self-contained and license-free.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.settings = { masterVolume: 0.8, sfxVolume: 1, musicVolume: 0.5 };
    this._crowdNode = null;
  }

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.settings.masterVolume;
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.settings.sfxVolume;
    this.sfxGain.connect(this.master);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.settings.musicVolume;
    this.musicGain.connect(this.master);
  }

  resume() {
    this.ensure();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  applySettings(s) {
    this.settings = { ...this.settings, ...s };
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(this.settings.masterVolume, this.ctx.currentTime, 0.05);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, this.ctx.currentTime, 0.05);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume, this.ctx.currentTime, 0.05);
  }

  _noiseBuffer(duration = 1) {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  click() {
    this.resume();
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'square'; o.frequency.value = 720;
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + 0.07);
  }

  puckHit(power = 1) {
    this.resume();
    const ctx = this.ctx, t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(0.15);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = 900 + power * 800; bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35 * power + 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    noise.connect(bp); bp.connect(g); g.connect(this.sfxGain);
    noise.start(t); noise.stop(t + 0.18);

    const o = ctx.createOscillator(); const og = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(180 + power * 120, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    og.gain.setValueAtTime(0.25 * power, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(og); og.connect(this.sfxGain);
    o.start(t); o.stop(t + 0.16);
  }

  whoosh(duration = 0.4) {
    this.resume();
    const ctx = this.ctx, t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(duration);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(2200, t + duration);
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + duration * 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    noise.connect(bp); bp.connect(g); g.connect(this.sfxGain);
    noise.start(t); noise.stop(t + duration);
  }

  save() {
    this.resume();
    const ctx = this.ctx, t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(0.25);
    const bp = ctx.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 1500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    noise.connect(bp); bp.connect(g); g.connect(this.sfxGain);
    noise.start(t); noise.stop(t + 0.22);
  }

  postClang() {
    this.resume();
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(500, t + 0.5);
    g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + 0.6);
  }

  goalHorn() {
    this.resume();
    const ctx = this.ctx, t = ctx.currentTime;
    const freqs = [196, 246.94, 293.66]; // brass stack
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = f;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.08);
      g.gain.setValueAtTime(0.22, t + 1.3);
      g.gain.linearRampToValueAtTime(0, t + 1.7);
      o.connect(lp); lp.connect(g); g.connect(this.sfxGain);
      o.start(t + i * 0.02); o.stop(t + 1.8);
    });
  }

  crowdSwell(intensity = 1, duration = 1.6) {
    this.resume();
    const ctx = this.ctx, t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(duration);
    noise.loop = false;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = 700; bp.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25 * intensity, t + duration * 0.3);
    g.gain.exponentialRampToValueAtTime(0.05 * intensity, t + duration);
    noise.connect(bp); bp.connect(g); g.connect(this.sfxGain);
    noise.start(t); noise.stop(t + duration);
  }

  crowdGroan() {
    this.resume();
    const ctx = this.ctx, t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(0.8);
    const bp = ctx.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    noise.connect(bp); bp.connect(g); g.connect(this.sfxGain);
    noise.start(t); noise.stop(t + 0.8);
  }

  uiConfirm() {
    this.resume();
    const ctx = this.ctx, t = ctx.currentTime;
    [520, 780].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t + i * 0.06);
      g.gain.linearRampToValueAtTime(0.15, t + i * 0.06 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.18);
      o.connect(g); g.connect(this.sfxGain);
      o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.2);
    });
  }
}

export const audio = new AudioEngine();
