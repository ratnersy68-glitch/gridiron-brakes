import { el } from '../dom.js';
import { COSMETICS, purchaseCosmetic, equipCosmetic } from '../../progression/Cosmetics.js';
import { EventBus } from '../../core/Utils.js';

let activeTab = 'shapes';
const TAB_LABELS = { shapes: 'Shapes', trails: 'Trails', colors: 'Colors', deathEffects: 'Death FX', icons: 'Icons', bgEffects: 'Backgrounds' };
const SAVE_KEY = { shapes: 'unlockedShapes', trails: 'unlockedTrails', colors: 'unlockedColors', deathEffects: 'unlockedDeathEffects', icons: 'unlockedIcons', bgEffects: 'unlockedBgEffects' };
const EQUIP_KEY = { shapes: 'shape', trails: 'trail', colors: 'color', deathEffects: 'deathEffect', icons: 'icon', bgEffects: 'bgEffect' };

export function renderShop(root, game) {
  const d = game.save.data;
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('button', { class: 'btn small close-x interactive', onClick: () => game.ui.showScreen('mainMenu') }, ['✕ Back']));
  screen.appendChild(el('h2', { class: 'title-font' }, ['Shop']));
  screen.appendChild(el('div', { class: 'currency-badge', style: 'margin-bottom:16px;' }, [`◆ ${d.currency}`]));

  const tabs = el('div', { class: 'tabs' });
  for (const key of Object.keys(TAB_LABELS)) {
    tabs.appendChild(el('div', { class: `chip interactive${activeTab === key ? ' active' : ''}`, onClick: () => { activeTab = key; game.ui.refresh(); } }, [TAB_LABELS[key]]));
  }
  screen.appendChild(tabs);

  const grid = el('div', { class: 'cosmetic-grid' });
  const owned = d[SAVE_KEY[activeTab]];
  const equipped = d.equipped[EQUIP_KEY[activeTab]];
  for (const item of COSMETICS[activeTab]) {
    const isOwned = owned.includes(item.id);
    const isEquipped = equipped === item.id;
    const swatchColor = item.hex || '#6a4dff';
    grid.appendChild(el('div', { class: `cosmetic-card${isEquipped ? ' equipped' : ''}` }, [
      el('div', { class: 'swatch', style: `background:${swatchColor}; box-shadow: inset 0 0 20px rgba(0,0,0,0.4), 0 0 12px ${swatchColor}55;` }),
      el('div', { style: 'font-size:0.8rem; font-weight:700; margin-bottom:6px;' }, [item.name]),
      isOwned
        ? el('button', {
          class: `btn small interactive${isEquipped ? '' : ' primary'}`, disabled: isEquipped,
          onClick: () => { equipCosmetic(game.save, activeTab, item.id); game.ui.refresh(); },
        }, [isEquipped ? 'Equipped' : 'Equip'])
        : el('button', {
          class: 'btn small interactive', disabled: d.currency < item.cost,
          onClick: () => {
            const res = purchaseCosmetic(game.save, activeTab, item.id);
            if (res.ok) { EventBus.emit('shop:purchase', item); game.ui.toast(`Unlocked ${item.name}!`); }
            game.ui.refresh();
          },
        }, [item.cost === 0 ? 'Free' : `◆ ${item.cost}`]),
    ]));
  }
  screen.appendChild(grid);
  root.appendChild(screen);
}
