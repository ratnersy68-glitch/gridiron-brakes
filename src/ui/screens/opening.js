import { cardTileEl } from '../cardView.js';
import { burstConfetti } from '../confetti.js';
import { sfx, revealSoundForRarity } from '../../systems/sound.js';
import { boxArtEl, stylePackEl } from '../boxArt.js';

// Reveal escalation tiers:
//   common/uncommon  quick flip
//   rare             slow flip + glow
//   epic             zoom pop + light rays
//   legendary/mythic screen shake + spotlight + confetti
//   impossible       all of the above, bigger
//   oneofone         room darkens, gold beams, fireworks, card rotates in 3D
const BIG_HIT_RARITIES = new Set(['legendary', 'mythic', 'impossible', 'oneofone']);
const DRAMATIC_RARITIES = new Set(['rare', 'epic', 'legendary', 'mythic', 'impossible', 'oneofone']);

function flashScreen() {
  const flash = document.createElement('div');
  flash.className = 'screen-flash active';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 450);
}

function spotlightOverlay(duration = 1600) {
  const el = document.createElement('div');
  el.className = 'spotlight-overlay';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

function oneOfOneCeremony(cardEl) {
  const room = document.createElement('div');
  room.className = 'room-darken';
  const beams = document.createElement('div');
  beams.className = 'gold-beams';
  room.appendChild(beams);
  document.body.appendChild(room);
  cardEl.classList.add('one-of-one-spin');
  sfx.announcer();
  burstConfetti(180);
  setTimeout(() => burstConfetti(120), 700);
  setTimeout(() => {
    room.remove();
    cardEl.classList.remove('one-of-one-spin');
  }, 2600);
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

  // --- Stage 1: the sealed box ---
  const boxWrap = document.createElement('div');
  boxWrap.className = 'box-3d-wrap';
  const boxVisual = boxArtEl(box, { width: 260, height: 195 });
  boxVisual.classList.add('box-3d-visual');
  const shrinkWrap = document.createElement('div');
  shrinkWrap.className = 'shrink-wrap';
  boxWrap.appendChild(boxVisual);
  boxWrap.appendChild(shrinkWrap);
  const boxHint = document.createElement('div');
  boxHint.className = 'muted';
  boxHint.textContent = 'Tap the box to tear the shrink wrap.';
  stage.appendChild(boxWrap);
  stage.appendChild(boxHint);

  boxWrap.addEventListener('click', () => {
    boxWrap.classList.add('rotating');
    sfx.boxShake();
    setTimeout(() => {
      sfx.wrapTear();
      shrinkWrap.classList.add('torn');
      boxWrap.classList.remove('rotating');
      setTimeout(() => {
        boxWrap.classList.add('opened');
        setTimeout(() => {
          stage.innerHTML = '';
          showPackTray();
        }, 420);
      }, 350);
    }, 550);
  }, { once: true });

  function showPackTray() {
    const title = document.createElement('div');
    title.className = 'muted';
    title.textContent = `${totalPacks} foil packs — tap one to rip it open`;
    stage.appendChild(title);

    const tray = document.createElement('div');
    tray.className = 'pack-tray';
    const packEls = [];
    packs.forEach((pack, idx) => {
      const packEl = document.createElement('div');
      packEl.className = 'pack-item';
      packEl.style.animationDelay = `${idx * 0.05}s`;
      stylePackEl(packEl, box);
      packEl._pack = pack;
      packEl.addEventListener('click', () => openPack(packEl, pack, idx), { once: true });
      packEls.push(packEl);
      tray.appendChild(packEl);
    });
    stage.appendChild(tray);

    const ripAllBtn = document.createElement('button');
    ripAllBtn.className = 'btn btn-ghost btn-sm';
    ripAllBtn.textContent = '⚡ Rip All Packs';
    ripAllBtn.title = 'Skip the pack-by-pack ritual and open everything at once';
    ripAllBtn.addEventListener('click', () => ripAllRemaining(packEls, ripAllBtn));
    stage.appendChild(ripAllBtn);

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

  function ripAllRemaining(packEls, ripAllBtn) {
    ripAllBtn.disabled = true;
    sfx.packRip();
    const remaining = packEls.filter(el => !el.classList.contains('used') && !el.classList.contains('torn'));
    const allCards = [];
    for (const el of remaining) {
      el.classList.add('torn', 'used');
      game.recordPackOpened();
      allCards.push(...el._pack);
    }
    openedCount = totalPacks;
    revealAllFast(allCards);
    setTimeout(() => { stage._finishBtn.style.display = 'inline-flex'; }, 600);
  }

  // Compact fast reveal for Rip All: every card lands face-up in a summary
  // grid with a quick stagger; hits keep their glow and one confetti burst
  // fires if the batch contains anything legendary or better.
  function revealAllFast(cards) {
    const zone = document.getElementById('reveal-zone');
    zone.innerHTML = '';
    zone.classList.add('summary-grid');
    let hasBigHit = false;
    let hasOneOfOne = false;
    cards.forEach((card, i) => {
      const holder = document.createElement('div');
      holder.className = 'summary-card fade-in';
      holder.style.animationDelay = `${Math.min(i * 0.03, 1.2)}s`;
      holder.appendChild(cardTileEl(card, { showValue: true, valueOverride: game.cardValue(card) }));
      const { isDuplicate } = game.collectCard(card);
      if (isDuplicate) {
        const dupTag = document.createElement('div');
        dupTag.className = 'tag dup-tag';
        dupTag.textContent = 'Duplicate';
        holder.appendChild(dupTag);
      }
      if (BIG_HIT_RARITIES.has(card.rarityKey)) hasBigHit = true;
      if (card.rarityKey === 'oneofone') hasOneOfOne = true;
      zone.appendChild(holder);
    });
    if (hasBigHit) {
      setTimeout(() => {
        flashScreen();
        burstConfetti(hasOneOfOne ? 160 : 80);
        if (hasOneOfOne) sfx.announcer(); else sfx.revealLegendary();
      }, 500);
    }
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
          if (card.rarityKey === 'rare') outer.classList.add('slow-flip');
          sfx.cardFlip();
          setTimeout(() => revealSoundForRarity(card.rarityKey), 300);

          if (card.rarityKey === 'epic' || card.rarityKey === 'impossible') {
            setTimeout(() => {
              outer.classList.add('epic-zoom');
              const rays = document.createElement('div');
              rays.className = 'light-rays';
              outer.appendChild(rays);
              setTimeout(() => rays.remove(), 1800);
            }, 350);
          }

          if (BIG_HIT_RARITIES.has(card.rarityKey)) {
            setTimeout(() => {
              outer.classList.add('big-hit-shake');
              flashScreen();
              spotlightOverlay();
              burstConfetti(card.rarityKey === 'oneofone' ? 160 : 90);
              if (card.rarityKey === 'oneofone') oneOfOneCeremony(outer);
            }, 350);
          }
        });
        const { isDuplicate } = game.collectCard(card);
        if (isDuplicate) {
          const dupTag = document.createElement('div');
          dupTag.className = 'tag dup-tag';
          dupTag.textContent = 'Duplicate';
          back.appendChild(dupTag);
        }
      }, revealDelay);
    });
  }
}
