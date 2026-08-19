import { MODES } from '../data/modes.js';
import { getDifficulty, nextDifficulty } from '../data/difficulty.js';
import { getChallenge } from '../data/challenges.js';

// Orchestrates a full shootout session (classic/best5/suddendeath/endless/
// challenge) across many individual attempts run by AttemptController.
export class ModeController {
  constructor() {
    this.reset();
  }

  reset() {
    this.modeId = null;
    this.challengeId = null;
    this.round = 0;
    this.playerScore = 0;
    this.opponentScore = 0;
    this.misses = 0;
    this.streak = 0;
    this.bestStreakThisSession = 0;
    this.attempts = [];
    this.done = false;
    this.winner = null;
    this.challengeState = null;
    this.difficultyId = 'rookie';
    this.pendingOpponentShot = false;
  }

  startSession(modeId, difficultyId) {
    this.reset();
    this.modeId = modeId;
    this.difficultyId = difficultyId;
  }

  startChallenge(challengeId) {
    this.reset();
    this.modeId = 'challenge';
    this.challengeId = challengeId;
    const c = getChallenge(challengeId);
    this.difficultyId = c.difficultyId;
    this.challengeState = { progress: 0, attempts: 0, target: c.target, maxAttempts: c.maxAttempts || Infinity };
  }

  currentDifficulty() {
    return getDifficulty(this.difficultyId);
  }

  mode() {
    return MODES[this.modeId] || null;
  }

  // Call after every resolved player attempt. Returns a status descriptor
  // the UI/main loop uses to decide what happens next (continue, opponent
  // cutaway, or session end).
  recordAttempt(result) {
    this.attempts.push(result);
    if (result.goal) { this.streak++; this.bestStreakThisSession = Math.max(this.bestStreakThisSession, this.streak); }
    else { this.streak = 0; }

    if (this.modeId === 'challenge') {
      return this._recordChallenge(result);
    }

    if (result.goal) this.playerScore++;
    else this.misses++;

    const mode = this.mode();
    if (mode.endless) {
      if (result.goal && this.playerScore % 3 === 0) {
        this.difficultyId = nextDifficulty(this.difficultyId).id;
      }
      if (this.misses >= mode.maxMisses) {
        this.done = true;
        this.winner = null;
        return { status: 'session_end' };
      }
      return { status: 'continue' };
    }

    // classic / best5 / suddendeath: opponent shoots after the player
    this.round++;
    if (mode.suddenDeath && this.round > mode.rounds) {
      return { status: 'opponent_sudden' };
    }
    if (this.round >= mode.rounds) {
      return { status: 'opponent_final' };
    }
    return { status: 'opponent_turn' };
  }

  _recordChallenge(result) {
    const c = getChallenge(this.challengeId);
    const state = this.challengeState;
    state.attempts++;
    const won = c.evaluate(result, state);
    if (won) {
      this.done = true;
      this.winner = 'player';
      return { status: 'challenge_win' };
    }
    if (c.fail && c.fail(result, state)) {
      this.done = true;
      this.winner = null;
      return { status: 'challenge_fail' };
    }
    if (state.attempts >= state.maxAttempts) {
      this.done = true;
      this.winner = null;
      return { status: 'challenge_fail' };
    }
    return { status: 'continue' };
  }

  // Simple weighted coin flip representing the broadcast-style opponent
  // shot cutaway used in head-to-head modes.
  simulateOpponentShot() {
    const scored = Math.random() < 0.42;
    if (scored) this.opponentScore++;
    return scored;
  }

  afterOpponentShot(triggerStatus) {
    const mode = this.mode();
    if (triggerStatus === 'opponent_sudden') {
      if (this.playerScore !== this.opponentScore) {
        this.done = true;
        this.winner = this.playerScore > this.opponentScore ? 'player' : 'opponent';
        return { status: 'session_end' };
      }
      this.round++;
      return { status: 'continue' };
    }
    if (triggerStatus === 'opponent_final') {
      if (mode.suddenDeath && this.playerScore === this.opponentScore) {
        this.round = mode.rounds + 1;
        return { status: 'continue' };
      }
      this.done = true;
      if (this.playerScore === this.opponentScore) this.winner = 'tie';
      else this.winner = this.playerScore > this.opponentScore ? 'player' : 'opponent';
      return { status: 'session_end' };
    }
    return { status: 'continue' };
  }

  challengeProgressLabel() {
    if (this.modeId !== 'challenge' || !this.challengeState) return '';
    const c = getChallenge(this.challengeId);
    return c.progressLabel(this.challengeState.progress, this.challengeState.target);
  }
}
