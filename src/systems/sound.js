// All SFX are synthesized with WebAudio so the game needs zero external
// audio assets. Kept intentionally simple: short oscillator blips/sweeps
// tuned per event.

let ctx = null;
let enabled = true;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setSoundEnabled(v) { enabled = v; }
export function isSoundEnabled() { return enabled; }

function tone({ freq = 440, dur = 0.15, type = 'sine', gain = 0.15, freqEnd = null, delay = 0 }) {
  if (!enabled) return;
  try {
    const c = getCtx();
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch { /* audio unavailable, fail silently */ }
}

function noiseBurst({ dur = 0.12, gain = 0.08, delay = 0 }) {
  if (!enabled) return;
  try {
    const c = getCtx();
    const bufferSize = c.sampleRate * dur;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, c.currentTime + delay);
    src.connect(g).connect(c.destination);
    src.start(c.currentTime + delay);
  } catch { /* ignore */ }
}

export const sfx = {
  click: () => tone({ freq: 520, dur: 0.06, type: 'square', gain: 0.06 }),
  boxShake: () => tone({ freq: 90, dur: 0.1, type: 'sawtooth', gain: 0.08 }),
  wrapTear: () => noiseBurst({ dur: 0.2, gain: 0.12 }),
  packRip: () => noiseBurst({ dur: 0.28, gain: 0.16 }),
  cardSlide: () => tone({ freq: 700, freqEnd: 1200, dur: 0.12, type: 'sine', gain: 0.06 }),
  cardFlip: () => tone({ freq: 300, freqEnd: 550, dur: 0.1, type: 'triangle', gain: 0.07 }),
  revealCommon: () => tone({ freq: 440, dur: 0.12, type: 'sine', gain: 0.08 }),
  revealUncommon: () => tone({ freq: 520, dur: 0.15, type: 'sine', gain: 0.09 }),
  revealRare: () => tone({ freq: 620, freqEnd: 900, dur: 0.25, type: 'sine', gain: 0.1 }),
  revealEpic: () => tone({ freq: 700, freqEnd: 1100, dur: 0.35, type: 'triangle', gain: 0.12 }),
  revealLegendary: () => {
    tone({ freq: 500, freqEnd: 1400, dur: 0.5, type: 'sawtooth', gain: 0.12 });
    tone({ freq: 900, dur: 0.6, type: 'sine', gain: 0.08, delay: 0.1 });
  },
  revealMythic: () => {
    tone({ freq: 400, freqEnd: 1600, dur: 0.6, type: 'sawtooth', gain: 0.14 });
    tone({ freq: 1200, dur: 0.7, type: 'sine', gain: 0.1, delay: 0.15 });
  },
  revealImpossible: () => {
    tone({ freq: 300, freqEnd: 1800, dur: 0.7, type: 'square', gain: 0.14 });
    tone({ freq: 1500, dur: 0.8, type: 'sine', gain: 0.12, delay: 0.2 });
    tone({ freq: 2000, dur: 0.5, type: 'sine', gain: 0.08, delay: 0.4 });
  },
  revealOneOfOne: () => {
    [0, 0.15, 0.3, 0.45].forEach((d, i) => tone({ freq: 500 + i * 220, dur: 0.4, type: 'sine', gain: 0.14, delay: d }));
  },
  cashRegister: () => { tone({ freq: 1200, dur: 0.08, type: 'square', gain: 0.08 }); tone({ freq: 1500, dur: 0.08, type: 'square', gain: 0.08, delay: 0.07 }); },
  announcer: () => {
    // stadium-horn style fanfare for the one-of-one ceremony
    [0, 0.22, 0.44].forEach((d, i) => {
      tone({ freq: 220 * (i + 1) / (i ? i : 1), dur: 0.5, type: 'sawtooth', gain: 0.12, delay: d });
    });
    tone({ freq: 110, dur: 1.2, type: 'sawtooth', gain: 0.1, delay: 0 });
    tone({ freq: 880, dur: 0.9, type: 'sine', gain: 0.1, delay: 0.5 });
    noiseBurst({ dur: 0.5, gain: 0.06, delay: 0.6 });
  },
  achievement: () => { tone({ freq: 660, dur: 0.12, type: 'sine', gain: 0.1 }); tone({ freq: 880, dur: 0.18, type: 'sine', gain: 0.1, delay: 0.1 }); },
  error: () => tone({ freq: 180, dur: 0.15, type: 'sawtooth', gain: 0.08 }),
};

export function revealSoundForRarity(rarityKey) {
  const map = {
    common: sfx.revealCommon, uncommon: sfx.revealUncommon, rare: sfx.revealRare,
    epic: sfx.revealEpic, legendary: sfx.revealLegendary, mythic: sfx.revealMythic,
    impossible: sfx.revealImpossible, oneofone: sfx.revealOneOfOne,
  };
  (map[rarityKey] || sfx.revealCommon)();
}
