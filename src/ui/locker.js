import { CATEGORIES, ITEMS } from '../data/cosmetics.js';
import { purchaseItem, equipItem } from '../core/progression.js';
import { saveProfile } from '../core/storage.js';
import { toast } from './nav.js';

const CATEGORY_LABELS = {
  stick: 'Stick', gloves: 'Gloves', skates: 'Skates', jersey: 'Jersey',
  pants: 'Pants', celebration: 'Celebration', goalieMask: 'Goalie Mask', trail: 'Puck Trail',
};

export function initLockerRoom(profile, { onEquipChange }) {
  const tabs = document.getElementById('locker-tabs');
  const grid = document.getElementById('locker-grid');
  const coinLabel = document.getElementById('locker-coins');
  let activeCategory = 'stick';

  function refreshCoins() { coinLabel.textContent = profile.coins; }

  function renderTabs() {
    tabs.innerHTML = '';
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'locker-tab' + (cat === activeCategory ? ' active' : '');
      btn.textContent = CATEGORY_LABELS[cat];
      btn.addEventListener('click', () => { activeCategory = cat; renderTabs(); renderGrid(); });
      tabs.appendChild(btn);
    });
  }

  function renderGrid() {
    grid.innerHTML = '';
    const items = ITEMS[activeCategory] || [];
    items.forEach((item) => {
      const owned = (profile.ownedItems[activeCategory] || []).includes(item.id);
      const equipped = profile.loadout[activeCategory] === item.id;
      const locked = profile.level < item.unlockLevel;
      const card = document.createElement('div');
      card.className = 'item-card' + (equipped ? ' equipped' : '');
      const swatch = document.createElement('div');
      swatch.className = 'item-swatch';
      swatch.style.background = `#${(item.color ?? 0x888888).toString(16).padStart(6, '0')}`;
      card.appendChild(swatch);
      const name = document.createElement('div');
      name.className = 'item-name';
      name.textContent = item.name;
      card.appendChild(name);

      if (locked) {
        const lbl = document.createElement('div');
        lbl.className = 'item-locked-label';
        lbl.textContent = `Unlocks at level ${item.unlockLevel}`;
        card.appendChild(lbl);
      } else if (!owned) {
        const cost = document.createElement('div');
        cost.className = 'item-cost';
        cost.textContent = item.cost > 0 ? `🪙 ${item.cost}` : 'Free';
        card.appendChild(cost);
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = 'Unlock';
        btn.addEventListener('click', () => {
          const res = purchaseItem(profile, activeCategory, item.id);
          if (res.ok) {
            equipItem(profile, activeCategory, item.id);
            saveProfile(profile);
            toast(`Unlocked ${item.name}!`);
            refreshCoins();
            renderGrid();
            onEquipChange(activeCategory);
          } else {
            toast(res.reason || 'Cannot unlock');
          }
        });
        card.appendChild(btn);
      } else {
        const btn = document.createElement('button');
        btn.className = 'btn' + (equipped ? ' btn-primary' : '');
        btn.textContent = equipped ? 'Equipped' : 'Equip';
        btn.disabled = equipped;
        btn.addEventListener('click', () => {
          equipItem(profile, activeCategory, item.id);
          saveProfile(profile);
          renderGrid();
          onEquipChange(activeCategory);
        });
        card.appendChild(btn);
      }
      grid.appendChild(card);
    });
  }

  renderTabs(); renderGrid(); refreshCoins();
  return { refresh: () => { refreshCoins(); renderGrid(); } };
}
