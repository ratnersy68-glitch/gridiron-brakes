import { money } from '../utils/format.js';
import { sfx } from '../systems/sound.js';

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'boxes', label: 'Box Shop' },
  { key: 'binder', label: 'Binder' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'shopjob', label: 'Card Shop' },
  { key: 'store', label: 'My Store' },
  { key: 'achievements', label: 'Achievements' },
  { key: 'settings', label: 'Settings' },
];

export function renderShell(app, game, screenRenderers) {
  app.innerHTML = '';

  const topbar = document.createElement('div');
  topbar.className = 'topbar';

  const brand = document.createElement('div');
  brand.className = 'brand';
  brand.textContent = '🏈 Gridiron Breaks';
  topbar.appendChild(brand);

  const navTabs = document.createElement('div');
  navTabs.className = 'nav-tabs';
  TABS.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'nav-tab' + (game.currentScreen === tab.key ? ' active' : '');
    btn.textContent = tab.label;
    btn.addEventListener('click', () => { sfx.click(); game.setScreen(tab.key); });
    navTabs.appendChild(btn);
  });
  topbar.appendChild(navTabs);

  const cashPill = document.createElement('div');
  cashPill.className = 'stat-pill';
  cashPill.innerHTML = `💵 <span class="val">${money(game.state.cash)}</span>`;
  topbar.appendChild(cashPill);

  const dayPill = document.createElement('div');
  dayPill.className = 'stat-pill';
  dayPill.innerHTML = `📅 Day <span class="val">${game.state.day}</span>`;
  topbar.appendChild(dayPill);

  const nextDayBtn = document.createElement('button');
  const stipendOn = game.stipendEnabled();
  nextDayBtn.className = 'btn btn-sm ' + (stipendOn ? 'btn-gold' : 'btn-ghost');
  nextDayBtn.textContent = stipendOn ? 'Advance Day 💰' : 'Advance Day ⏭';
  nextDayBtn.title = stipendOn
    ? 'Advance the market, collect passive income, and bank your $1,000,000 daily payout'
    : 'Advance the market and collect passive income';
  nextDayBtn.addEventListener('click', () => { game.advanceDay(); });
  topbar.appendChild(nextDayBtn);

  app.appendChild(topbar);

  const content = document.createElement('div');
  content.className = 'content fade-in';
  content.id = 'screen-content';
  app.appendChild(content);

  const renderer = screenRenderers[game.currentScreen] || screenRenderers.home;
  renderer(content, game);
}
