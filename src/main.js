import * as THREE from 'three';
import { loadProfile, saveProfile } from './core/storage.js';
import { audio } from './core/audio.js';
import { InputManager } from './core/input.js';
import { buildRink, PUCK_START_Z } from './render/rinkBuilder.js';
import { buildShooterModel, buildGoalieModel } from './render/playerBuilder.js';
import { EffectsManager } from './render/effects.js';
import { AttemptController } from './game/attemptController.js';
import { ModeController } from './game/modeController.js';
import { getDifficulty, DIFFICULTIES } from './data/difficulty.js';
import { getGoalie } from './data/goalies.js';
import { getArena } from './data/arenas.js';
import { getChallenge } from './data/challenges.js';
import { getItem, computeLoadoutStats } from './data/cosmetics.js';
import { SHOT_TYPES } from './data/shots.js';
import { applyAttemptToProfile, recordChallengeComplete, recordBossBeaten, rankName } from './core/progression.js';
import { showScreen, toast, wireBackNav } from './ui/nav.js';
import { initModeSelect, initChallenges, quickplayConfig } from './ui/menu.js';
import { initLockerRoom } from './ui/locker.js';
import { renderLeaderboard } from './ui/leaderboard.js';
import { renderSettings } from './ui/settings.js';
import * as hud from './ui/hud.js';

const profile = loadProfile();
audio.applySettings(profile.settings);

const container = document.getElementById('game-canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);

function applyGraphicsQuality(quality) {
  if (quality === 'low') {
    renderer.shadowMap.enabled = false;
    renderer.setPixelRatio(1);
  } else if (quality === 'medium') {
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
  } else {
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  }
}

const forceLandscapeQuery = matchMedia('(orientation: portrait) and (pointer: coarse)');

function resize() {
  // In forced-landscape mode (see style.css), the page is rotated 90deg via
  // CSS to fill a portrait phone screen, so the renderer/camera need the
  // swapped (landscape) dimensions to match what will actually be on screen.
  const rotated = forceLandscapeQuery.matches;
  const w = rotated ? window.innerHeight : window.innerWidth;
  const h = rotated ? window.innerWidth : window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 50));
if (forceLandscapeQuery.addEventListener) forceLandscapeQuery.addEventListener('change', resize);
resize();

let rinkRefs = buildRink(scene, getArena(profile.lastArena));

const puck = new THREE.Mesh(
  new THREE.CylinderGeometry(0.038, 0.038, 0.02, 20),
  new THREE.MeshStandardMaterial({ color: getItem('trail', profile.loadout.trail)?.color ?? 0x161616, roughness: 0.4 })
);
puck.castShadow = true;
scene.add(puck);

let shooterModel = buildShooterModel(profile.loadout);
shooterModel.position.set(0, 0, PUCK_START_Z);
shooterModel.rotation.y = Math.PI;
scene.add(shooterModel);

let goalieModel = buildGoalieModel(profile.loadout);
goalieModel.position.set(0, 0, 0.85);
scene.add(goalieModel);

const effects = new EffectsManager(scene);
const input = new InputManager(renderer.domElement);
input.invertY = profile.settings.invertY;
input.rotatedLandscape = forceLandscapeQuery.matches;
if (forceLandscapeQuery.addEventListener) {
  forceLandscapeQuery.addEventListener('change', () => { input.rotatedLandscape = forceLandscapeQuery.matches; });
}
applyGraphicsQuality(profile.settings.quality);

const attemptController = new AttemptController({
  scene, camera, effects, audio, input,
  shooterModel, goalieModel, puckMesh: puck, crowdGroup: rinkRefs.crowdGroup,
});

const modeController = new ModeController();

window.__debug = { attemptController, modeController, input, effects, profile, camera, renderer };

let currentArenaId = profile.lastArena;
let currentConfig = null;
let sessionTotals = { xp: 0, coins: 0 };
let inGameplay = false;
let menuOrbit = 0;

// ---------- header / model rebuild helpers ----------
function updateHeader() {
  document.getElementById('hdr-level').textContent = `Lv ${profile.level}`;
  document.getElementById('hdr-rank').textContent = rankName(profile.level);
  document.getElementById('hdr-coins').textContent = profile.coins;
}

function rebuildShooter() {
  scene.remove(shooterModel);
  shooterModel = buildShooterModel(profile.loadout);
  shooterModel.position.set(0, 0, PUCK_START_Z);
  shooterModel.rotation.y = Math.PI;
  scene.add(shooterModel);
  attemptController.shooter = shooterModel;
}

function rebuildGoalie() {
  scene.remove(goalieModel);
  goalieModel = buildGoalieModel(profile.loadout);
  goalieModel.position.set(0, 0, 0.85);
  scene.add(goalieModel);
  attemptController.goalie = goalieModel;
}

function switchArena(arenaId) {
  if (arenaId === currentArenaId && rinkRefs) return;
  scene.remove(rinkRefs.group);
  rinkRefs = buildRink(scene, getArena(arenaId));
  attemptController.crowdGroup = rinkRefs.crowdGroup;
  effects.setSnow(getArena(arenaId).weather === 'snow');
  currentArenaId = arenaId;
}

// ---------- navigation ----------
function goToMainMenu() {
  inGameplay = false;
  hud.setHudActive(false);
  showScreen('screen-main-menu');
  updateHeader();
}

wireBackNav((navId) => {
  if (navId === 'quickplay') { startShootout(quickplayConfig(profile)); return; }
  if (navId === 'screen-main-menu') { goToMainMenu(); return; }
  showScreen(navId);
  if (navId === 'screen-mode-select') initModeSelect(profile, { onStart: startShootout });
  if (navId === 'screen-challenges') initChallenges(profile, { onStart: startChallenge });
  if (navId === 'screen-leaderboard') renderLeaderboard(profile);
  if (navId === 'screen-settings') {
    renderSettings(profile, {
      audio,
      onChange: (key, value) => {
        if (key === 'invertY') input.invertY = value;
        if (key === 'quality') applyGraphicsQuality(value);
      },
      onReset: (fresh) => { Object.assign(profile, fresh); rebuildShooter(); rebuildGoalie(); input.invertY = profile.settings.invertY; applyGraphicsQuality(profile.settings.quality); updateHeader(); toast('Save reset'); },
    });
  }
  if (navId === 'screen-locker') {
    initLockerRoom(profile, {
      onEquipChange: (category) => {
        rebuildShooter();
        if (category === 'goalieMask') rebuildGoalie();
        if (category === 'trail') {
          puck.material.color.setHex(getItem('trail', profile.loadout.trail).color);
        }
        updateHeader();
      },
    });
    updateHeader();
  }
});

document.getElementById('btn-boot-start').addEventListener('click', () => {
  audio.resume();
  audio.uiConfirm();
  showScreen('screen-main-menu');
  updateHeader();
});

document.getElementById('btn-hud-quit').addEventListener('click', () => {
  input.setEnabled(false);
  goToMainMenu();
});

hud.initShotTypeBar(input);

// ---------- gameplay flow ----------
function startShootout(config) {
  currentConfig = { ...config, kind: 'mode' };
  profile.lastArena = config.arenaId;
  saveProfile(profile);
  switchArena(config.arenaId);

  const difficulty = getDifficulty(config.difficultyId);
  const personality = getGoalie(config.goalieId);
  const arena = getArena(config.arenaId);
  const loadoutStats = computeLoadoutStats(profile.loadout);

  attemptController.configure({
    difficulty, personality, loadoutStats,
    celebrationId: profile.loadout.celebration,
    trailColor: getItem('trail', profile.loadout.trail)?.color ?? 0x2244ff,
    confettiArena: arena.weather === 'confetti',
  });

  modeController.startSession(config.modeId, config.difficultyId);
  sessionTotals = { xp: 0, coins: 0 };

  showScreen(null);
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  hud.setHudActive(true);
  inGameplay = true;
  hud.setModeLabel(modeController.mode().name + ' · ' + personality.name);
  hud.setScore(`${modeController.playerScore} – ${modeController.opponentScore}`);
  hud.setChallengeLabel('');
  hud.setPrompt('Click and hold to charge your shot');
  beginAttempt();
}

function startChallenge(challengeId) {
  const c = getChallenge(challengeId);
  currentConfig = { kind: 'challenge', challengeId };
  const arenaId = profile.unlockedArenas.includes(profile.lastArena) ? profile.lastArena : 'localrink';
  switchArena(arenaId);

  const difficulty = getDifficulty(c.difficultyId);
  const personality = getGoalie(c.goalieId);
  const loadoutStats = computeLoadoutStats(profile.loadout);

  attemptController.configure({
    difficulty, personality, loadoutStats,
    celebrationId: profile.loadout.celebration,
    trailColor: getItem('trail', profile.loadout.trail)?.color ?? 0x2244ff,
    confettiArena: getArena(arenaId).weather === 'confetti',
  });

  modeController.startChallenge(challengeId);
  sessionTotals = { xp: 0, coins: 0 };

  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  hud.setHudActive(true);
  inGameplay = true;
  hud.setModeLabel(c.name + (c.boss ? ' · BOSS' : ''));
  hud.setScore('');
  hud.setChallengeLabel(c.desc);
  hud.setPrompt('Click and hold to charge your shot');
  beginAttempt();
}

function beginAttempt() {
  attemptController.startAttempt();
  attemptController.onResult = handleAttemptResult;
}

let waitingForNext = null;

function handleAttemptResult(result) {
  const award = applyAttemptToProfile(profile, result, currentConfigDifficultyId(), result.timeToRelease);
  saveProfile(profile);
  sessionTotals.xp += award.xp;
  sessionTotals.coins += award.coins;
  if (award.leveledUp) toast(`Level up! You're now level ${award.newLevel}`);
  award.newlyUnlockedArenas.forEach((a) => toast(`New arena unlocked: ${a.name}`));
  updateHeader();

  showOutcomeBanner(result);

  const status = modeController.recordAttempt(result);

  if (modeController.modeId === 'challenge') {
    hud.setChallengeLabel(`${getChallenge(currentConfig.challengeId).desc}  —  ${modeController.challengeProgressLabel()}`);
  } else {
    hud.setScore(`${modeController.playerScore} – ${modeController.opponentScore}`);
  }

  waitingForNext = () => afterBannerSettled(status);
}

function currentConfigDifficultyId() {
  if (currentConfig.kind === 'challenge') return getChallenge(currentConfig.challengeId).difficultyId;
  return modeController.difficultyId;
}

function showOutcomeBanner(result) {
  const specialLabels = {
    topShelf: 'TOP SHELF!', fiveHole: 'FIVE HOLE!', postAndIn: 'POST AND IN!!',
    michigan: 'MICHIGAN!!!', backhandDeke: 'BACKHAND DEKE!', spinMove: 'SPIN MOVE!',
    oneTimer: 'ONE-TIMER!', powerShot: 'POWER SHOT!',
  };
  if (result.goal) {
    const sub = result.special && specialLabels[result.special] ? specialLabels[result.special] : (result.beatBySpeed ? 'Too quick to react!' : '');
    hud.showResultBanner('GOAL!', sub, 'goal');
  } else if (result.save) {
    hud.showResultBanner('SAVED', 'The goalie read it', 'save');
  } else if (result.post) {
    hud.showResultBanner('OFF THE POST', 'So close', 'post');
  } else {
    hud.showResultBanner('MISS', result.special === 'michigan' ? 'The puck popped off the blade' : 'Wide of the net', 'miss');
  }
}

async function afterBannerSettled(status) {
  if (currentConfig.kind === 'challenge') {
    if (status.status === 'challenge_win' || status.status === 'challenge_fail') {
      finishChallengeSession(status.status === 'challenge_win');
      return;
    }
    beginAttempt();
    return;
  }

  if (status.status === 'continue') { beginAttempt(); return; }

  if (status.status === 'opponent_turn' || status.status === 'opponent_final' || status.status === 'opponent_sudden') {
    await hud.showOpponentBanner('Opponent shoots...');
    const scored = modeController.simulateOpponentShot();
    if (scored) { audio.goalHorn(); } else { audio.save(); }
    await hud.showOpponentBanner(scored ? 'OPPONENT SCORES' : 'DENIED!');
    hud.setScore(`${modeController.playerScore} – ${modeController.opponentScore}`);
    const after = modeController.afterOpponentShot(status.status);
    if (after.status === 'session_end') { finishModeSession(); return; }
    beginAttempt();
    return;
  }

  if (status.status === 'session_end') { finishModeSession(); return; }
  beginAttempt();
}

function finishModeSession() {
  inGameplay = false;
  hud.setHudActive(false);
  const w = modeController.winner;
  const title = w === 'player' ? 'You Win the Shootout!' : w === 'opponent' ? 'Tough Loss' : w === 'tie' ? 'It Ends in a Tie' : 'Run Complete';
  const goals = modeController.attempts.filter((a) => a.goal).length;
  const stats = modeController.mode().endless
    ? [[goals, 'Goals'], [modeController.bestStreakThisSession, 'Best Streak'], [DIFFICULTIES.find((d) => d.id === modeController.difficultyId).name, 'Peak Difficulty']]
    : [[`${modeController.playerScore} – ${modeController.opponentScore}`, 'Final Score'], [`${goals}/${modeController.attempts.length}`, 'Shots'], [modeController.bestStreakThisSession, 'Best Streak']];
  hud.renderResults({
    title, stats,
    rewards: `+${sessionTotals.xp} XP  ·  +${sessionTotals.coins} coins`,
  }, {
    onAgain: () => { showScreen(null); startShootout(currentConfig); },
    onMenu: () => { showScreen('screen-main-menu'); updateHeader(); },
  });
  showScreen('screen-results');
}

function finishChallengeSession(won) {
  inGameplay = false;
  hud.setHudActive(false);
  const c = getChallenge(currentConfig.challengeId);
  if (won) {
    recordChallengeComplete(profile, c.id);
    if (c.boss) recordBossBeaten(profile, c.goalieId);
    saveProfile(profile);
  }
  hud.renderResults({
    title: won ? `${c.name} — Complete!` : `${c.name} — Not Quite`,
    stats: [[modeController.challengeProgressLabel(), 'Objective'], [modeController.challengeState.attempts, 'Attempts']],
    rewards: `+${sessionTotals.xp} XP  ·  +${sessionTotals.coins} coins`,
  }, {
    onAgain: () => { showScreen(null); startChallenge(c.id); },
    onMenu: () => { showScreen('screen-main-menu'); updateHeader(); },
  });
  showScreen('screen-results');
}

// ---------- camera ----------
const camPos = new THREE.Vector3(0, 2.15, PUCK_START_Z + 4.0);
const camLook = new THREE.Vector3(0, 0.95, 0.5);
function updateCamera(dt) {
  if (inGameplay) {
    const shooterX = shooterModel.userData.parts.hips.position.x;
    const targetPos = new THREE.Vector3(shooterX * 0.5, 2.15, PUCK_START_Z + 4.0);
    const targetLook = new THREE.Vector3(shooterX * 0.3, 0.95, 0.5);
    camPos.lerp(targetPos, Math.min(1, dt * 4));
    camLook.lerp(targetLook, Math.min(1, dt * 4));
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    if (profile.settings.camShake) effects.applyCameraShake(camera);
  } else {
    menuOrbit += dt * 0.06;
    const r = 8.5;
    camera.position.set(Math.sin(menuOrbit) * r, 2.4, 4 + Math.cos(menuOrbit) * r * 0.4);
    camera.lookAt(0, 0.9, 0);
  }
}

// ---------- main loop ----------
let last = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  input.pollGamepad();

  if (inGameplay) {
    attemptController.update(dt);
    effects.update(dt);
    effects.updateSnow(dt * effects.timeScale);
    if (attemptController.phase === 'charging') {
      const t = (performance.now() - attemptController.chargeStart) / 1000;
      const shotType = attemptController.input.shotType;
      const ideal = SHOT_TYPES[shotType].chargeTime;
      hud.updatePowerMeter({
        active: true,
        fill: Math.min(1.15, t / ideal),
        sweetStart: Math.max(0, (ideal - attemptController.cfg.difficulty.perfectWindow / 2) / (ideal * 1.15)),
        sweetEnd: Math.min(1, (ideal + attemptController.cfg.difficulty.perfectWindow / 2) / (ideal * 1.15)),
      });
    } else {
      hud.updatePowerMeter({ active: false, fill: 0, sweetStart: 0, sweetEnd: 0 });
    }
    if (waitingForNext && attemptController.isDone()) {
      const fn = waitingForNext; waitingForNext = null; fn();
    }
  } else {
    effects.update(dt);
    effects.updateSnow(dt);
  }

  updateCamera(dt);
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
