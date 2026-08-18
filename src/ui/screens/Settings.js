import { el } from '../dom.js';

export function renderSettings(root, game) {
  const s = game.save.data.settings;
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('button', { class: 'btn small close-x interactive', onClick: () => game.ui.showScreen('mainMenu') }, ['✕ Back']));
  screen.appendChild(el('h2', { class: 'title-font' }, ['Settings']));

  const panel = el('div', { class: 'panel', style: 'width:min(440px,90vw);' });

  panel.appendChild(slider('Music Volume', s.musicVolume, (v) => { s.musicVolume = v; game.audio.applyVolumes(); game.save.save(); }));
  panel.appendChild(slider('SFX Volume', s.sfxVolume, (v) => { s.sfxVolume = v; game.audio.applyVolumes(); game.save.save(); }));

  panel.appendChild(select('Graphics Quality', ['low', 'medium', 'high'], s.graphicsQuality, (v) => { s.graphicsQuality = v; game.save.save(); game.renderer.quality = v; }));

  panel.appendChild(toggle('Screen Shake', s.screenShake, (v) => { s.screenShake = v; game.save.save(); }));
  panel.appendChild(toggle('Particle Effects', s.particles, (v) => { s.particles = v; game.particles.enabled = v; game.save.save(); }));
  panel.appendChild(toggle('Reduce Flash', s.reduceFlash, (v) => { s.reduceFlash = v; game.save.save(); }));
  panel.appendChild(toggle('Colorblind-friendly Palette', s.colorblindMode, (v) => { s.colorblindMode = v; game.save.save(); }));
  panel.appendChild(toggle('Fullscreen', s.fullscreen, (v) => {
    s.fullscreen = v; game.save.save();
    if (v) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  }));

  panel.appendChild(el('div', { class: 'field', style: 'margin-top:10px;' }, [
    el('div', { class: 'small-text', style: 'margin-bottom:6px;' }, ['Keybinds']),
    el('div', { class: 'row between' }, [el('span', {}, ['Jump / Fly / Flip']), el('span', {}, [s.keybinds.jump])]),
    el('div', { class: 'row between' }, [el('span', {}, ['Pause']), el('span', {}, [s.keybinds.pause])]),
    el('div', { class: 'hint' }, ['Click gameplay or press Space to jump. Rebinding UI coming soon — Space/Click/Tap always work.']),
  ]));

  panel.appendChild(el('button', { class: 'btn danger interactive', style: 'margin-top:14px;', onClick: () => {
    if (confirm('Reset ALL progress? This cannot be undone.')) { game.save.reset(); game.ui.refresh(); }
  } }, ['Reset Save Data']));

  screen.appendChild(panel);
  root.appendChild(screen);
}

function slider(label, value, onChange) {
  const wrap = el('label', { class: 'field' }, [`${label}: ${Math.round(value * 100)}%`]);
  const input = el('input', { type: 'range', min: '0', max: '1', step: '0.01', value, class: 'interactive' });
  input.addEventListener('input', (e) => {
    onChange(parseFloat(e.target.value));
    wrap.firstChild.textContent = `${label}: ${Math.round(parseFloat(e.target.value) * 100)}%`;
  });
  wrap.appendChild(input);
  return wrap;
}

function toggle(label, value, onChange) {
  const wrap = el('label', { class: 'field row between' }, [label]);
  const input = el('input', { type: 'checkbox', class: 'interactive' });
  input.checked = value;
  input.addEventListener('change', (e) => onChange(e.target.checked));
  wrap.appendChild(input);
  return wrap;
}

function select(label, options, value, onChange) {
  const wrap = el('label', { class: 'field' }, [label]);
  const sel = el('select', { class: 'interactive' });
  for (const o of options) sel.appendChild(el('option', { value: o, selected: o === value }, [o]));
  sel.addEventListener('change', (e) => onChange(e.target.value));
  wrap.appendChild(sel);
  return wrap;
}
