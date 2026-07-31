// Binder: the permanent collection ledger. Cards sold or traded leave
// ownedCards, but everCollectedKeys never shrinks — "every card ever
// collected stays recorded," per design. This module derives groupings,
// missing-card checklists, and set-completion state from that ledger.

import { PLAYERS, getPlayer, CURATED_PLAYERS } from '../data/players.js';
import { TEAMS, getTeam } from '../data/teams.js';
import { FINISHES, NUMBERED_PARALLELS, SIGNATURE_TYPES, INSERT_SETS } from '../data/cardTypes.js';
import { bus } from './eventBus.js';

const ALL_TYPES_BY_CATEGORY = {
  finish: FINISHES, numbered: NUMBERED_PARALLELS, signature: SIGNATURE_TYPES, insert: INSERT_SETS,
};

export const TOTAL_CHECKLIST_SLOTS = PLAYERS.length * Object.values(ALL_TYPES_BY_CATEGORY).reduce((s, l) => s + l.length, 0);

export function ownsAnyOf(state, playerId) {
  const prefix = `${playerId}::`;
  return state.everCollectedKeys.some(k => k.startsWith(prefix));
}

export function ownedCategoriesFor(state, playerId) {
  const prefix = `${playerId}::`;
  const cats = new Set();
  for (const k of state.everCollectedKeys) {
    if (k.startsWith(prefix)) cats.add(k.split('::')[1]);
  }
  return cats;
}

export function groupOwnedCards(state, groupBy = 'team') {
  const groups = new Map();
  for (const card of state.ownedCards) {
    let keys;
    switch (groupBy) {
      case 'player': keys = [card.playerName]; break;
      case 'team': keys = [card.teamName]; break;
      case 'year': keys = [String(card.rookieYear)]; break;
      case 'parallel': keys = [card.category === 'finish' ? card.typeLabel : null].filter(Boolean); break;
      case 'numbered': keys = [card.category === 'numbered' ? card.typeLabel : null].filter(Boolean); break;
      case 'insert': keys = [card.category === 'insert' ? card.typeLabel : null].filter(Boolean); break;
      case 'auto': keys = [card.category === 'signature' ? card.typeLabel : null].filter(Boolean); break;
      case 'rarity': keys = [card.rarityLabel]; break;
      default: keys = ['All Cards'];
    }
    for (const k of keys) {
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(card);
    }
  }
  return groups;
}

export function missingChecklistForTeam(state, teamId) {
  const roster = PLAYERS.filter(p => p.teamId === teamId);
  return roster.map(p => ({ player: p, owned: ownsAnyOf(state, p.id) }));
}

function teamRoster(teamId) { return PLAYERS.filter(p => p.teamId === teamId); }

export function recomputeCollectionStats(state) {
  const stats = state.stats;

  // Overall completion percentage across the full checklist universe.
  stats.binderCompletionPct = Math.min(100, (state.everCollectedKeys.length / TOTAL_CHECKLIST_SLOTS) * 100);

  // Team sets.
  const newlyCompletedTeams = [];
  for (const team of TEAMS) {
    const roster = teamRoster(team.id);
    if (!roster.length) continue;
    const ownedCount = roster.filter(p => ownsAnyOf(state, p.id)).length;
    const progress = ownedCount / roster.length;
    stats.teamSetProgress[team.id] = progress;
    const wasComplete = stats.teamSetsComplete.includes(team.id);
    if (progress >= 1 && !wasComplete) {
      stats.teamSetsComplete.push(team.id);
      newlyCompletedTeams.push(team);
    }
  }

  // Curated player "master" sets: own a card in every category (finish,
  // numbered, signature, insert) for that star.
  const newlyMastered = [];
  for (const star of CURATED_PLAYERS) {
    const cats = ownedCategoriesFor(state, star.id);
    const progress = cats.size / 4;
    stats.playerMasterProgress[star.id] = progress;
    const wasMastered = stats.playerMastered.includes(star.id);
    if (progress >= 1 && !wasMastered) {
      stats.playerMastered.push(star.id);
      newlyMastered.push(star);
    }
  }

  const totalNewSets = newlyCompletedTeams.length + newlyMastered.length;
  if (totalNewSets > 0) {
    stats.setsCompleted += totalNewSets;
    for (const team of newlyCompletedTeams) bus.emit('set-completed', { type: 'team', name: team.name, id: team.id });
    for (const star of newlyMastered) bus.emit('set-completed', { type: 'player', name: star.name, id: star.id });
  }

  return { newlyCompletedTeams, newlyMastered };
}

export function completionRewardFor(type) {
  // Cash awarded once, the moment a set completes.
  return type === 'team' ? 750 : 1500;
}
