import { cardTileEl } from '../cardView.js';
import { burstConfetti } from '../confetti.js';
import { sfx, revealSoundForRarity } from '../../systems/sound.js';
import { money } from '../../utils/format.js';

const BIG_HIT_RARITIES = new Set(['legendary', 'mythic', 'impossible', 'oneofone']);
const DRAMATIC_RARITIES = new Set(['rare', 'epic', 'legendary', 'mythic', 'impossible', 'oneofone']);

function flashScreen() {
  const flash = document.createElement('div');
  flash.className = 'screen-flash active';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 450);
}

export function renderOpening(container, game) {
  const { box, packs } = game.screenParams;
  if (!box || !packs) { game.setScreen('boxes'); return; }

  let openedCount = 0;
  const totalPacks = packs.length;

  const wrap = document.createElement('div');
  wrap.className = 'panel';
  wrap.innerHTML = `<div class="panel-title">Opening: ${box.name} <span class="sub">${box.brand}</span></div>`;

  const stage = document.createElement('div');
  stage.className = 'opening-stage';
  wrap.appendChild(stage);
  container.appendChild(wrap);

  // --- Stage 1: box ---
  const boxEl = document.createElement('div');
  boxEl.className = 'box-3d';
  boxEl.textContent = '📦';
  const boxHint = document.createElement('div');
  boxHint.className = 'muted';
  boxHint.textContent = 'Click the box to break the wrap.';
  stage.appendChild(boxEl);
  stage.appendChild(boxHint);

  boxEl.addEventListener('click', () => {
    boxEl.classList.add('shaking');
    sfx.boxShake();
    setTimeout(() => {
      sfx.wrapTear();
      boxEl.classList.remove('shaking');
      boxEl.classList.add('opened');
      setTimeout(() => {
        stage.innerHTML = '';
        showPackTray();
      }, 380);
    }, 500);
  }, { once: true });

  function showPackTray() {
    const title = document.createElement('div');
    title.className = 'muted';
    title.textContent = `${totalPacks} packs — click one to rip it open`;
    stage.appendChild(title);

    const tray = document.createElement('div');
    tray.className = 'pack-tray';
    packs.forEach((pack, idx) => {
      const packEl = document.createElement('div');
      packEl.className = 'pack-item';
      packEl.style.animationDelay = `${idx * 0.05}s`;
      packEl.textContent = '🏈';
      packEl.addEventListener('click', () => openPack(packEl, pack, idx), { once: true });
      tray.appendChild(packEl);
    });
    stage.appendChild(tray);

    const revealZone = document.createElement('div');
    revealZone.className = 'reveal-row';
    revealZone.id = 'reveal-zone';
    stage.appendChild(revealZone);

    const finishBtn = document.createElement('button');
    finishBtn.className = 'btn btn-gold mt-16';
    finishBtn.textContent = 'Finish & View Binder';
    finishBtn.style.display = 'none';
    finishBtn.addEventListener('click', () => {
      game.finishOpening();
      game.setScreen('binder');
    });
    stage.appendChild(finishBtn);
    stage._finishBtn = finishBtn;
  }

  function openPack(packEl, pack, idx) {
    packEl.classList.add('torn');
    sfx.packRip();
    setTimeout(() => {
      packEl.classList.add('used');
      revealCards(pack);
      openedCount += 1;
      if (openedCount >= totalPacks) {
        setTimeout(() => { stage._finishBtn.style.display = 'inline-flex'; }, 400);
      }
    }, 320);
  }

  function revealCards(cards) {
    const zone = document.getElementById('reveal-zone');
    zone.innerHTML = '';
    game.recordPackOpened();

    cards.forEach((card, i) => {
      const dramatic = DRAMATIC_RARITIES.has(card.rarityKey);
      const outer = document.createElement('div');
      outer.className = `reveal-card rarity-${card.rarityKey}`;
      outer.style.animationDelay = `${i * 0.12}s`;

      const inner = document.createElement('div');
      inner.className = 'flip-inner';

      const front = document.createElement('div');
      front.className = 'flip-face front';
      front.textContent = '🏈';

      const back = document.createElement('div');
      back.className = 'flip-face back';

      inner.appendChild(front);
      inner.appendChild(back);
      outer.appendChild(inner);
      zone.appendChild(outer);

      const revealDelay = 250 + i * 140 + (dramatic ? 350 : 0);
      setTimeout(() => {
        sfx.cardSlide();
        const tile = cardTileEl(card, { showValue: true, valueOverride: game.cardValue(card) });
        back.appendChild(tile);
        requestAnimationFrame(() => {
          outer.classList.add('flipped');
          sfx.cardFlip();
          setTimeout(() => revealSoundForRarity(card.rarityKey), 300);

          if (BIG_HIT_RARITIES.has(card.rarityKey)) {
            setTimeout(() => {
              outer.classList.add('big-hit-shake');
              flashScreen();
              burstConfetti(card.rarityKey === 'oneofone' ? 160 : 90);
            }, 350);
          }
        });
        const { isDuplicate } = game.collectCard(card);
        if (isDuplicate) {
          const dupTag = document.createElement('div');
          dupTag.className = 'tag mt-8';
          dupTag.textContent = 'Duplicate';
          back.appendChild(dupTag);
        }
      }, revealDelay);
    });
  }
}
