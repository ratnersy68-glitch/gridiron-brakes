// LocalStorage-backed save system: multiple named slots + autosave. State is
// plain JSON (all game logic/definitions live in data/system modules, never
// in the saved blob), so save/load is just stringify/parse.
//
// Every storage call is guarded. Browsers reject writes in a few ordinary
// situations — Safari Private Browsing, disabled site data, and above all a
// blown storage quota once a collection grows to thousands of cards — and an
// unguarded throw during autosave would take the whole game down. When
// storage is unavailable the game keeps running against an in-memory shim so
// play continues; only persistence is lost, and the player is told once.

const STORAGE_PREFIX = 'gridironBreaks.save.';
const SLOT_INDEX_KEY = 'gridironBreaks.slots';
const LAST_SLOT_KEY = 'gridironBreaks.lastSlot';
const MAX_SLOTS = 4;
const HISTORY_KEEP_ON_SAVE = 24; // price-chart points kept in the saved blob

let memoryFallback = new Map();
let storageBroken = false;

function store() {
  try {
    if (typeof localStorage === 'undefined') throw new Error('no localStorage');
    return localStorage;
  } catch {
    return null;
  }
}

function readKey(key) {
  const ls = store();
  if (!ls) return memoryFallback.get(key) ?? null;
  try { return ls.getItem(key); } catch { return memoryFallback.get(key) ?? null; }
}

function writeKey(key, value) {
  memoryFallback.set(key, value);
  const ls = store();
  if (!ls) return false;
  try { ls.setItem(key, value); return true; } catch { return false; }
}

function removeKey(key) {
  memoryFallback.delete(key);
  const ls = store();
  if (!ls) return;
  try { ls.removeItem(key); } catch { /* ignore */ }
}

/** True once a save has failed to persist, so the UI can warn about it. */
export function isStorageBroken() { return storageBroken; }

export function listSlots() {
  const raw = readKey(SLOT_INDEX_KEY);
  let ids = [];
  try { ids = raw ? JSON.parse(raw) : []; } catch { ids = []; }
  return ids.map(id => {
    const data = loadSlot(id);
    return data ? { id, name: data.name, cash: data.cash, updatedAt: data.updatedAt, day: data.day } : null;
  }).filter(Boolean);
}

function registerSlot(id) {
  const raw = readKey(SLOT_INDEX_KEY);
  let ids = [];
  try { ids = raw ? JSON.parse(raw) : []; } catch { ids = []; }
  if (!ids.includes(id)) ids.push(id);
  writeKey(SLOT_INDEX_KEY, JSON.stringify(ids));
}

export function nextFreeSlotId() {
  let existing = new Set();
  try { existing = new Set(JSON.parse(readKey(SLOT_INDEX_KEY) || '[]')); } catch { /* empty */ }
  for (let i = 1; i <= MAX_SLOTS; i++) {
    if (!existing.has(`slot${i}`)) return `slot${i}`;
  }
  return `slot${Date.now()}`;
}

// Price history is purely cosmetic (the binder's sparkline) and is by far the
// most compressible part of a save, so trim it before writing rather than
// letting it crowd out the collection itself.
function serializeForSave(state) {
  const history = state.market?.history;
  if (!history) return JSON.stringify(state);
  const trimmed = {};
  for (const [playerId, points] of Object.entries(history)) {
    trimmed[playerId] = points.length > HISTORY_KEEP_ON_SAVE
      ? points.slice(points.length - HISTORY_KEEP_ON_SAVE)
      : points;
  }
  return JSON.stringify({ ...state, market: { ...state.market, history: trimmed } });
}

export function saveSlot(id, state) {
  state.updatedAt = Date.now();
  const ok = writeKey(STORAGE_PREFIX + id, serializeForSave(state));
  if (!ok) {
    storageBroken = true;
    return false;
  }
  storageBroken = false;
  registerSlot(id);
  writeKey(LAST_SLOT_KEY, id);
  return true;
}

export function loadSlot(id) {
  const raw = readKey(STORAGE_PREFIX + id);
  if (!raw) return null;
  try { return migrateSave(JSON.parse(raw)); } catch { return null; }
}

export function deleteSlot(id) {
  removeKey(STORAGE_PREFIX + id);
  const raw = readKey(SLOT_INDEX_KEY);
  let ids = [];
  try { ids = raw ? JSON.parse(raw) : []; } catch { ids = []; }
  writeKey(SLOT_INDEX_KEY, JSON.stringify(ids.filter(x => x !== id)));
}

export function getLastSlotId() {
  return readKey(LAST_SLOT_KEY);
}

// Migration: saves created before the $100-start change that were never
// actually played (no packs, no spending, no earnings) still carry the old
// $1,000 opening balance — bring them in line. Progressed saves are left
// untouched.
function migrateSave(save) {
  const st = save?.stats || {};
  if (save && save.cash === 1000 && (st.totalPacksOpened || 0) === 0 &&
      (st.totalMoneySpent || 0) === 0 && (st.totalMoneyEarned || 0) === 0) {
    save.cash = 100;
    st.netWorth = 100;
  }
  return save;
}

let autosaveTimer = null;
export function startAutosave(getState, intervalMs = 30000) {
  stopAutosave();
  autosaveTimer = setInterval(() => {
    try {
      const state = getState();
      if (state) saveSlot(state.slotId, state);
    } catch (err) {
      console.error('[autosave] failed', err);
    }
  }, intervalMs);
}
export function stopAutosave() {
  if (autosaveTimer) clearInterval(autosaveTimer);
  autosaveTimer = null;
}
