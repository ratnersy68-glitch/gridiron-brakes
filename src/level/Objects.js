// Factory helpers for level objects. Keeping construction here (rather than
// literal objects scattered through pattern/generator code) is what lets the
// editor and the generator share exactly the same object shapes.

let _uid = 0;
const uid = () => `o${_uid++}`;

export function ground(x, w, y) { return { id: uid(), type: 'ground', x, y, w, h: 9999, solid: true }; }

export function block(x, y, w = 40, h = 40) { return { id: uid(), type: 'block', x, y: y - h, w, h, solid: true }; }

export function movingPlatform(x, y, w, h, opts = {}) {
  return {
    id: uid(), type: 'movingPlatform', solid: true,
    baseX: x, baseY: y - h, x, y: y - h, w, h,
    axis: opts.axis || 'y', amplitude: opts.amplitude ?? 90, speed: opts.speed ?? 1.4, phase: opts.phase ?? 0,
  };
}

export function disappearingPlatform(x, y, w, h, opts = {}) {
  return {
    id: uid(), type: 'disappearingPlatform', solid: true, visible: true,
    x, y: y - h, w, h,
    onTime: opts.onTime ?? 1.2, offTime: opts.offTime ?? 0.8, phase: opts.phase ?? 0,
  };
}

export function spike(x, groundY, opts = {}) {
  const w = opts.w || 34, h = opts.h || 34;
  const ceil = !!opts.ceiling;
  return {
    id: uid(), type: 'hazard', shape: 'spike', ceiling: ceil,
    x, y: ceil ? (opts.y ?? 0) : groundY - h, w, h,
  };
}

export function fakeSpike(x, groundY, opts = {}) {
  // Looks identical to a spike but is flagged non-lethal — rewards players
  // who learn the level instead of relying purely on reflexes.
  const s = spike(x, groundY, opts);
  s.fake = true;
  return s;
}

export function saw(x, y, opts = {}) {
  return { id: uid(), type: 'hazard', shape: 'circle', x, y, r: opts.r || 22 };
}

export function sawTrack(x, y, opts = {}) {
  return { id: uid(), type: 'hazard', shape: 'circle', movingHazard: true, baseX: x, baseY: y, x, y, r: opts.r || 20, axis: opts.axis || 'x', amplitude: opts.amplitude ?? 80, speed: opts.speed ?? 1.6, phase: opts.phase ?? 0 };
}

export function pad(x, y, opts = {}) {
  return { id: uid(), type: 'pad', x, y: y - 16, w: 34, h: 16, power: opts.power ?? 900, kind: opts.kind || 'yellow' };
}

export function ring(x, y, opts = {}) {
  return { id: uid(), type: 'ring', x, y, r: 22, power: opts.power ?? 760 };
}

export function portal(x, y, h, effect, opts = {}) {
  return { id: uid(), type: 'portal', x, y: y - h / 2, w: opts.w || 44, h, effect, label: opts.label || '' };
}

export function coin(x, y, opts = {}) {
  return { id: uid(), type: 'coin', x, y, r: 14, collected: false, hard: !!opts.hard };
}

export function endFlag(x, groundY) {
  return { id: uid(), type: 'end', x, y: groundY - 120, w: 20, h: 240 };
}
