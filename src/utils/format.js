// Grail-tier prices run past Number.MAX_SAFE_INTEGER (~9.0e15), so the very
// top of the ladder is held as an approximate float. That's invisible here
// because everything at that scale renders in abbreviated units. The ladder
// runs well past the most expensive grail because a compounding payout keeps
// climbing after the Vault is complete; beyond it we fall back to exponent
// notation rather than printing a meaningless wall of digits.
const UNITS = [
  [1e33, 'Dc'], [1e30, 'No'], [1e27, 'Oc'], [1e24, 'Sp'], [1e21, 'Sx'],
  [1e18, 'Qi'], [1e15, 'Qa'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'],
];

export function money(n) {
  const abs = Math.abs(n);
  if (abs >= 1e36) return `$${n.toExponential(2)}`;
  // The 0.9995 slack promotes values that would otherwise round to "1000.00"
  // of the smaller unit (e.g. $999,999,999,900 reads as $1.00T, not $1000.00B).
  for (const [scale, suffix] of UNITS) {
    if (abs >= scale * 0.9995) return `$${(n / scale).toFixed(2)}${suffix}`;
  }
  if (abs >= 10_000) return `$${(n / 1000).toFixed(1)}K`;
  if (abs < 10 && Math.round(n) !== n) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString()}`;
}

export function moneyExact(n) {
  const abs = Math.abs(n);
  // Past the safe-integer range a digit-by-digit figure would be fictional
  // precision, so fall back to the abbreviated form.
  if (abs >= 1e15) return money(n);
  if (abs < 100 && Math.round(n * 100) / 100 !== Math.round(n)) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString()}`;
}

export function pct(n, digits = 0) {
  return `${(n * 100).toFixed(digits)}%`;
}

export function compact(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}
