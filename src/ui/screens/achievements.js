import { ACHIEVEMENTS } from '../../data/achievements.js';
import { achievementProgress } from '../../systems/achievementsEngine.js';
import { pct } from '../../utils/format.js';

let activeCategory = 'all';

export function renderAchievements(container, game) {
  const s = game.state;
  const wrap = document.createElement('div');

  const unlockedCount = s.achievementsUnlocked.length;
  const header = document.createElement('div');
  header.className = 'panel';
  header.innerHTML = `<div class="panel-title">Achievements <span class="sub">${unlockedCount} / ${ACHIEVEMENTS.length} unlocked</span></div>`;
  wrap.appendChild(header);

  const categories = ['all', ...new Set(ACHIEVEMENTS.map(a => a.category))];
  const filterPanel = document.createElement('div');
  filterPanel.className = 'panel';
  const filterRow = document.createElement('div');
  filterRow.className = 'filter-row';
  categories.forEach(cat => {
    const chip = document.createElement('button');
    chip.className = 'filter-chip' + (activeCategory === cat ? ' active' : '');
    chip.textContent = cat.replace(/_/g, ' ');
    chip.addEventListener('click', () => { activeCategory = cat; rerender(); });
    filterRow.appendChild(chip);
  });
  filterPanel.appendChild(filterRow);

  const list = document.createElement('div');
  list.className = 'grid grid-cols-3 section-scroll';
  const filtered = ACHIEVEMENTS.filter(a => activeCategory === 'all' || a.category === activeCategory);
  filtered.slice(0, 300).forEach(a => {
    const unlocked = s.achievementsUnlocked.includes(a.id);
    const progress = achievementProgress(s, a);
    const el = document.createElement('div');
    el.className = 'stat-block';
    el.style.opacity = unlocked ? '1' : '0.75';
    el.innerHTML = `<div class="label">${unlocked ? '✅' : a.icon} ${a.name}</div>
      <div class="muted" style="font-size:12px;margin-top:4px;">${a.desc}</div>
      <div class="progress-bar mt-8"><div class="fill" style="width:${Math.round(progress * 100)}%"></div></div>`;
    list.appendChild(el);
  });
  filterPanel.appendChild(list);
  if (filtered.length > 300) {
    const note = document.createElement('div');
    note.className = 'muted mt-8';
    note.textContent = `Showing first 300 of ${filtered.length} in this category.`;
    filterPanel.appendChild(note);
  }
  wrap.appendChild(filterPanel);
  container.appendChild(wrap);

  function rerender() { container.innerHTML = ''; renderAchievements(container, game); }
}
