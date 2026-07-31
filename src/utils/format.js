export function money(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `$${(n / 1000).toFixed(1)}K`;
  if (abs < 10 && Math.round(n) !== n) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString()}`;
}

export function moneyExact(n) {
  const abs = Math.abs(n);
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
