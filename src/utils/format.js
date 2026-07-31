export function money(n) {
  const v = Math.round(n);
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `$${(v / 1000).toFixed(1)}K`;
  return `$${v.toLocaleString()}`;
}

export function moneyExact(n) {
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
