// mobile-app/src/utils/heatmapGrid.js
// Pure helper: build a dense weeks x 7 (Mon-top) grid + quantile buckets
// from the sparse daily-activity API response.

const MS_DAY = 86400000;

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYMD(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Monday of the week containing `d`
function mondayOf(d) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (copy.getDay() + 6) % 7; // 0 = Monday
  copy.setDate(copy.getDate() - dow);
  return copy;
}

function computeThresholds(nonZero) {
  const sorted = [...nonZero].sort((a, b) => a - b);
  const distinct = [...new Set(sorted)];
  if (sorted.length === 0) return [0, 0, 0];
  if (distinct.length < 4) {
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const step = (max - min) / 4 || 1;
    return [min + step, min + step * 2, min + step * 3];
  }
  const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))];
  return [q(0.25), q(0.5), q(0.75)];
}

function bucketFor(total, [t1, t2, t3]) {
  if (total <= 0) return 0;
  if (total <= t1) return 1;
  if (total <= t2) return 2;
  if (total <= t3) return 3;
  return 4;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function buildHeatmapGrid(days, from, to) {
  if (!from || !to) return { grid: [], monthLabels: [], thresholds: [0, 0, 0], maxTotal: 0 };

  const byDate = new Map((days || []).map((d) => [d.date, d]));
  const fromD = parseYMD(from);
  const toD = parseYMD(to);
  const gridStart = mondayOf(fromD);
  const totalDays = Math.round((toD - gridStart) / MS_DAY) + 1;
  const numCols = Math.ceil(totalDays / 7);

  const nonZero = (days || []).map((d) => d.expenseTotal).filter((v) => v > 0);
  const thresholds = computeThresholds(nonZero);
  const maxTotal = nonZero.length ? Math.max(...nonZero) : 0;

  const grid = [];
  const monthLabels = [];
  let lastMonth = -1;

  for (let col = 0; col < numCols; col++) {
    const week = [];
    for (let row = 0; row < 7; row++) {
      const cellDate = new Date(gridStart.getTime() + (col * 7 + row) * MS_DAY);
      const key = ymd(cellDate);
      const inWindow = cellDate >= fromD && cellDate <= toD;
      if (!inWindow) {
        week.push({ date: null, expenseTotal: 0, count: 0, bucket: 0, inWindow: false });
        continue;
      }
      const hit = byDate.get(key);
      const expenseTotal = hit ? hit.expenseTotal : 0;
      const count = hit ? hit.count : 0;
      week.push({
        date: key,
        expenseTotal,
        count,
        bucket: bucketFor(expenseTotal, thresholds),
        inWindow: true,
      });
      if (row === 0) {
        const m = cellDate.getMonth();
        if (m !== lastMonth) {
          monthLabels.push({ colIndex: col, label: MONTHS[m] });
          lastMonth = m;
        }
      }
    }
    grid.push(week);
  }

  return { grid, monthLabels, thresholds, maxTotal };
}
