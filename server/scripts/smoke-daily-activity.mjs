// server/scripts/smoke-daily-activity.mjs
// Usage: BASE=http://localhost:5000 TOKEN=<jwt> node scripts/smoke-daily-activity.mjs
const BASE = process.env.BASE || 'http://localhost:5000';
const TOKEN = process.env.TOKEN;
if (!TOKEN) { console.error('Set TOKEN'); process.exit(1); }
const h = { Authorization: `Bearer ${TOKEN}` };

async function get(path) {
  const r = await fetch(`${BASE}/api${path}`, { headers: h });
  return { status: r.status, data: await r.json() };
}

let r = await get('/analytics/daily-activity');
console.assert(r.status === 200, 'default 200', r.status);
console.assert(r.data.data.weeks === 16, 'default weeks 16', r.data.data.weeks);
console.assert(Array.isArray(r.data.data.days), 'days is array');
console.assert(
  r.data.data.days.every((d, i, a) => i === 0 || a[i - 1].date <= d.date),
  'days sorted ascending'
);
console.assert(
  r.data.data.days.every((d) => d.count > 0),
  'no zero-count days'
);
console.log('16w days:', r.data.data.days.length, 'window:', r.data.data.from, '→', r.data.data.to);

r = await get('/analytics/daily-activity?weeks=999');
console.assert(r.data.data.weeks === 53, 'clamp to 53', r.data.data.weeks);

r = await get('/analytics/daily-activity?weeks=bogus');
console.assert(r.data.data.weeks === 16, 'bogus → 16', r.data.data.weeks);

console.log('\nSMOKE OK');
