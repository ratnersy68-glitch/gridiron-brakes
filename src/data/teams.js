// Fictional league structure: the American Gridiron League (AGL)
// 32 wholly original teams, 8 divisions, inspired by football culture in general
// but with no real city/team name pairings, mascots, or logos copied.

export const CONFERENCES = ['Eastern Conference', 'Western Conference'];

export const TEAMS = [
  // Eastern Conference
  { id: 'blz', name: 'Buffalo Blizzard', city: 'Buffalo', conference: 'Eastern Conference', division: 'East North', colors: ['#0d3b66', '#e0e0e0'] },
  { id: 'lib', name: 'Philadelphia Liberty', city: 'Philadelphia', conference: 'Eastern Conference', division: 'East North', colors: ['#0f4c2c', '#c9a24b'] },
  { id: 'rvn', name: 'Baltimore Ravenside', city: 'Baltimore', conference: 'Eastern Conference', division: 'East North', colors: ['#3a1f5d', '#111111'] },
  { id: 'pat', name: 'Foxborough Patriarchs', city: 'Foxborough', conference: 'Eastern Conference', division: 'East North', colors: ['#1b2a4a', '#c0392b'] },
  { id: 'wav', name: 'Miami Waves', city: 'Miami', conference: 'Eastern Conference', division: 'East South', colors: ['#00a1a8', '#ff7f50'] },
  { id: 'lgt', name: 'Tampa Lightning Bolts', city: 'Tampa', conference: 'Eastern Conference', division: 'East South', colors: ['#d0021b', '#2b2b2b'] },
  { id: 'atk', name: 'Atlanta Talons', city: 'Atlanta', conference: 'Eastern Conference', division: 'East South', colors: ['#8a1538', '#1a1a1a'] },
  { id: 'car', name: 'Charlotte Wildcats', city: 'Charlotte', conference: 'Eastern Conference', division: 'East South', colors: ['#00b3a3', '#1c1c1c'] },
  { id: 'wnd', name: 'Chicago Wind', city: 'Chicago', conference: 'Eastern Conference', division: 'East Central', colors: ['#132b52', '#e8a33d'] },
  { id: 'mtr', name: 'Detroit Motors', city: 'Detroit', conference: 'Eastern Conference', division: 'East Central', colors: ['#0057b8', '#c0c0c0'] },
  { id: 'lmb', name: 'Green Bay Lumber', city: 'Green Bay', conference: 'Eastern Conference', division: 'East Central', colors: ['#245c3a', '#e0b04a'] },
  { id: 'vik', name: 'Minneapolis Vantage', city: 'Minneapolis', conference: 'Eastern Conference', division: 'East Central', colors: ['#4b2e83', '#e8b923'] },
  { id: 'stl', name: 'Washington Sentinels', city: 'Washington', conference: 'Eastern Conference', division: 'East Rivers', colors: ['#002f6c', '#c60c30'] },
  { id: 'bng', name: 'Cincinnati Stripes', city: 'Cincinnati', conference: 'Eastern Conference', division: 'East Rivers', colors: ['#fb4f14', '#0a0a0a'] },
  { id: 'stl2', name: 'Pittsburgh Foundry', city: 'Pittsburgh', conference: 'Eastern Conference', division: 'East Rivers', colors: ['#ffb612', '#101820'] },
  { id: 'clv', name: 'Cleveland Anchors', city: 'Cleveland', conference: 'Eastern Conference', division: 'East Rivers', colors: ['#5b2b13', '#f47321'] },
  // Western Conference
  { id: 'com', name: 'Kansas Comets', city: 'Kansas City', conference: 'Western Conference', division: 'West Plains', colors: ['#c8102e', '#ffd200'] },
  { id: 'brn', name: 'Denver Broncs', city: 'Denver', conference: 'Western Conference', division: 'West Plains', colors: ['#0a2343', '#f7621a'] },
  { id: 'rdr', name: 'Las Vegas Outlaws', city: 'Las Vegas', conference: 'Western Conference', division: 'West Plains', colors: ['#1a1a1a', '#a6a6a6'] },
  { id: 'bol', name: 'San Diego Bolts', city: 'San Diego', conference: 'Western Conference', division: 'West Plains', colors: ['#0091d0', '#ffc20e'] },
  { id: 'gld', name: 'San Francisco Gold', city: 'San Francisco', conference: 'Western Conference', division: 'West Coast', colors: ['#981e32', '#c9a24b'] },
  { id: 'stm', name: 'Seattle Stormhawks', city: 'Seattle', conference: 'Western Conference', division: 'West Coast', colors: ['#0b3d2e', '#8fc93a'] },
  { id: 'rms', name: 'Los Angeles Rampage', city: 'Los Angeles', conference: 'Western Conference', division: 'West Coast', colors: ['#003594', '#ffcc33'] },
  { id: 'crd', name: 'Phoenix Blaze', city: 'Phoenix', conference: 'Western Conference', division: 'West Coast', colors: ['#97233f', '#000000'] },
  { id: 'lng', name: 'Dallas Longhorns', city: 'Dallas', conference: 'Western Conference', division: 'West South', colors: ['#08183b', '#a5acaf'] },
  { id: 'txn', name: 'Houston Launch', city: 'Houston', conference: 'Western Conference', division: 'West South', colors: ['#03202f', '#a71930'] },
  { id: 'jag', name: 'Jacksonville Prowl', city: 'Jacksonville', conference: 'Western Conference', division: 'West South', colors: ['#006778', '#d7a22a'] },
  { id: 'tnt', name: 'Nashville Rhythm', city: 'Nashville', conference: 'Western Conference', division: 'West South', colors: ['#0c2340', '#4b92db' ] },
  { id: 'stl3', name: 'Indianapolis Steeds', city: 'Indianapolis', conference: 'Western Conference', division: 'West Heartland', colors: ['#002c5f', '#ffffff'] },
  { id: 'brs', name: 'New Orleans Brass', city: 'New Orleans', conference: 'Western Conference', division: 'West Heartland', colors: ['#9f8958', '#101820'] },
  { id: 'grz', name: 'New York Gothams', city: 'New York', conference: 'Western Conference', division: 'West Heartland', colors: ['#004c54', '#a5acaf'] },
  { id: 'nyk', name: 'New York Knights', city: 'New York', conference: 'Western Conference', division: 'West Heartland', colors: ['#003087', '#c60c30'] },
];

export function getTeam(id) {
  return TEAMS.find(t => t.id === id);
}

export function randomTeam(rng) {
  return TEAMS[Math.floor(rng() * TEAMS.length)];
}
