// LocalStorage-backed save system: multiple named slots + autosave. State is
// plain JSON (all game logic/definitions live in data/system modules, never
// in the saved blob), so save/load is just stringify/parse.

const STORAGE_PREFIX = 'gridironBreaks.save.';
const SLOT_INDEX_KEY = 'gridironBreaks.slots';
const LAST_SLOT_KEY = 'gridironBreaks.lastSlot';
const MAX_SLOTS = 4;

export function listSlots() {
  const raw = localStorage.getItem(SLOT_INDEX_KEY);
  const ids = raw ? JSON.parse(raw) : [];
  return ids.map(id => {
    const data = loadSlot(id);
    return data ? { id, name: data.name, cash: data.cash, updatedAt: data.updatedAt, day: data.day } : null;
  }).filter(Boolean);
}

function registerSlot(id) {
  const raw = localStorage.getItem(SLOT_INDEX_KEY);
  const ids = raw ? JSON.parse(raw) : [];
  if (!ids.includes(id)) ids.push(id);
  localStorage.setItem(SLOT_INDEX_KEY, JSON.stringify(ids));
}

export function nextFreeSlotId() {
  const existing = new Set((JSON.parse(localStorage.getItem(SLOT_INDEX_KEY) || '[]')));
  for (let i = 1; i <= MAX_SLOTS; i++) {
    if (!existing.has(`slot${i}`)) return `slot${i}`;
  }
  return `slot${Date.now()}`;
}

export function saveSlot(id, state) {
  state.updatedAt = Date.now();
  localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(state));
  registerSlot(id);
  localStorage.setItem(LAST_SLOT_KEY, id);
}

export function loadSlot(id) {
  const raw = localStorage.getItem(STORAGE_PREFIX + id);
  if (!raw) return null;
  try { return migrateSave(JSON.parse(raw)); } catch { return null; }
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

export function deleteSlot(id) {
  localStorage.removeItem(STORAGE_PREFIX + id);
  const raw = localStorage.getItem(SLOT_INDEX_KEY);
  const ids = raw ? JSON.parse(raw) : [];
  localStorage.setItem(SLOT_INDEX_KEY, JSON.stringify(ids.filter(x => x !== id)));
}

export function getLastSlotId() {
  return localStorage.getItem(LAST_SLOT_KEY);
}

let autosaveTimer = null;
export function startAutosave(getState, intervalMs = 30000) {
  stopAutosave();
  autosaveTimer = setInterval(() => {
    const state = getState();
    if (state) saveSlot(state.slotId, state);
  }, intervalMs);
}
export function stopAutosave() {
  if (autosaveTimer) clearInterval(autosaveTimer);
  autosaveTimer = null;
}
