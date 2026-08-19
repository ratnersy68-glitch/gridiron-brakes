import { DIFFICULTIES } from '../data/difficulty.js';

export function renderLeaderboard(profile) {
  const list = document.getElementById('leaderboard-list');
  const s = profile.stats;
  const hardest = s.hardestGoalieBeaten !== null ? DIFFICULTIES[s.hardestGoalieBeaten].name : '—';
  const fastest = s.fastestGoal !== null ? `${s.fastestGoal.toFixed(2)}s` : '—';
  const rows = [
    ['High Score (career goals)', s.highScore],
    ['Most Goals', s.totalGoals],
    ['Longest Win Streak', s.longestStreak],
    ['Fastest Goal', fastest],
    ['Hardest Goalie Beaten', hardest],
    ['Best Shooting %', `${s.shootingPct}%`],
  ];
  list.innerHTML = rows.map(([label, value]) => `
    <div class="lb-row"><span class="lb-label">${label}</span><span class="lb-value">${value}</span></div>
  `).join('');
}
