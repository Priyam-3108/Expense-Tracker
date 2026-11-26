// server/scripts/smoke-privacy-default.mjs
// Usage: BASE=http://localhost:5000 TOKEN=<jwt> node scripts/smoke-privacy-default.mjs
const BASE = process.env.BASE || 'http://localhost:5000';
const TOKEN = process.env.TOKEN;
if (!TOKEN) { console.error('Set TOKEN'); process.exit(1); }
const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };

async function j(method, path, body) {
  const r = await fetch(`${BASE}/api${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json() };
}

let r = await j('GET', '/auth/profile');
console.assert(r.status === 200, 'profile 200', r.status);
console.assert('privacyModeDefault' in r.data.data.user, 'field present in profile', Object.keys(r.data.data.user));
const before = r.data.data.user.privacyModeDefault;
console.log('privacyModeDefault before:', before);

r = await j('PUT', '/auth/profile', { privacyModeDefault: !before });
console.assert(r.data.data.user.privacyModeDefault === !before, 'toggled', r.data.data.user.privacyModeDefault);

r = await j('PUT', '/auth/profile', { privacyModeDefault: 'garbage' });
console.assert(r.data.data.user.privacyModeDefault === !before, 'garbage ignored', r.data.data.user.privacyModeDefault);

// restore
await j('PUT', '/auth/profile', { privacyModeDefault: before });

console.log('\nSMOKE OK');
