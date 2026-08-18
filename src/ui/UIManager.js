// Central screen router. Each screen module exports render(root, game) and
// returns nothing — screens fully own their DOM subtree under #ui-root and
// re-render themselves as needed via game.ui.refresh().

import { clear } from './dom.js';
import { renderMainMenu } from './screens/MainMenu.js';
import { renderLevelSelect } from './screens/LevelSelect.js';
import { renderShop } from './screens/Shop.js';
import { renderSettings } from './screens/Settings.js';
import { renderAchievements } from './screens/Achievements.js';
import { renderStatistics } from './screens/Statistics.js';
import { renderDailyChallenge } from './screens/DailyChallenge.js';
import { renderPracticeSetup } from './screens/PracticePanel.js';

const SCREENS = {
  mainMenu: renderMainMenu,
  levelSelect: renderLevelSelect,
  shop: renderShop,
  settings: renderSettings,
  achievements: renderAchievements,
  statistics: renderStatistics,
  daily: renderDailyChallenge,
  practiceSetup: renderPracticeSetup,
};

export class UIManager {
  constructor(root, game) {
    this.root = root;
    this.game = game;
    this.current = null;
    this.params = null;
  }

  showScreen(name, params = {}) {
    this.current = name;
    this.params = params;
    this.refresh();
  }

  hide() {
    this.current = null;
    clear(this.root);
  }

  refresh() {
    clear(this.root);
    if (!this.current) return;
    const fn = SCREENS[this.current];
    if (!fn) { console.warn('Unknown screen', this.current); return; }
    fn(this.root, this.game, this.params);
  }

  toast(message) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    document.getElementById('app').appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }
}
