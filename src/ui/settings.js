import { DIFFICULTIES } from '../data/difficulty.js';
import { saveProfile, resetProfile } from '../core/storage.js';

export function renderSettings(profile, { audio, onChange, onReset }) {
  const list = document.getElementById('settings-list');
  list.innerHTML = '';

  function sliderRow(label, key) {
    const row = document.createElement('div');
    row.className = 'setting-row';
    row.innerHTML = `<label>${label}</label>`;
    const input = document.createElement('input');
    input.type = 'range'; input.min = '0'; input.max = '1'; input.step = '0.01';
    input.value = profile.settings[key];
    input.addEventListener('input', () => {
      profile.settings[key] = parseFloat(input.value);
      audio.applySettings(profile.settings);
      saveProfile(profile);
    });
    row.appendChild(input);
    list.appendChild(row);
  }
  sliderRow('Master Volume', 'masterVolume');
  sliderRow('SFX Volume', 'sfxVolume');
  sliderRow('Music Volume', 'musicVolume');

  const diffRow = document.createElement('div');
  diffRow.className = 'setting-row';
  diffRow.innerHTML = '<label>Default Difficulty</label>';
  const diffSelect = document.createElement('select');
  DIFFICULTIES.forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d.id; opt.textContent = d.name;
    if (profile.settings.difficulty === d.id) opt.selected = true;
    diffSelect.appendChild(opt);
  });
  diffSelect.addEventListener('change', () => {
    profile.settings.difficulty = diffSelect.value;
    saveProfile(profile);
  });
  diffRow.appendChild(diffSelect);
  list.appendChild(diffRow);

  const qualityRow = document.createElement('div');
  qualityRow.className = 'setting-row';
  qualityRow.innerHTML = '<label>Graphics Quality</label>';
  const qualitySelect = document.createElement('select');
  ['low', 'medium', 'high'].forEach((q) => {
    const opt = document.createElement('option');
    opt.value = q; opt.textContent = q[0].toUpperCase() + q.slice(1);
    if (profile.settings.quality === q) opt.selected = true;
    qualitySelect.appendChild(opt);
  });
  qualitySelect.addEventListener('change', () => {
    profile.settings.quality = qualitySelect.value;
    saveProfile(profile);
    onChange('quality', qualitySelect.value);
  });
  qualityRow.appendChild(qualitySelect);
  list.appendChild(qualityRow);

  function toggleRow(label, key) {
    const row = document.createElement('div');
    row.className = 'setting-row';
    row.innerHTML = `<label>${label}</label>`;
    const btn = document.createElement('button');
    btn.className = 'toggle-switch' + (profile.settings[key] ? ' on' : '');
    btn.addEventListener('click', () => {
      profile.settings[key] = !profile.settings[key];
      btn.classList.toggle('on', profile.settings[key]);
      saveProfile(profile);
      onChange(key, profile.settings[key]);
    });
    row.appendChild(btn);
    list.appendChild(row);
  }
  toggleRow('Invert Aim Y', 'invertY');
  toggleRow('Camera Shake', 'camShake');

  const resetRow = document.createElement('div');
  resetRow.className = 'setting-row';
  resetRow.innerHTML = '<label>Reset Save Data</label>';
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn';
  resetBtn.textContent = 'Reset';
  resetBtn.addEventListener('click', () => {
    if (confirm('Reset all progress, unlocks, and stats?')) {
      const fresh = resetProfile();
      onReset(fresh);
    }
  });
  resetRow.appendChild(resetBtn);
  list.appendChild(resetRow);
}
