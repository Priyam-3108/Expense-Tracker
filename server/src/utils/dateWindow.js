export function clampWeeks(raw) {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return 16;
  return Math.min(53, Math.max(1, n));
}

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function trailingWindow(weeks, today = new Date()) {
  const to = toYMD(today);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - (weeks * 7 - 1));
  return { from: toYMD(start), to };
}
