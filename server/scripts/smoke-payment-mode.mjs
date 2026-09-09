// server/scripts/smoke-payment-mode.mjs
// Usage: BASE=http://localhost:5000 TOKEN=<jwt> CATEGORY=<categoryId> node scripts/smoke-payment-mode.mjs
// Requires Node >= 18 for global fetch (or run older Node with --experimental-fetch).
const BASE = process.env.BASE || 'http://localhost:5000';
const TOKEN = process.env.TOKEN;
const CATEGORY = process.env.CATEGORY;
if (!TOKEN || !CATEGORY) {
  console.error('Set TOKEN and CATEGORY env vars (a valid JWT and one of that user\'s category ids).');
  process.exit(1);
}
const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };

async function j(method, path, body) {
  const r = await fetch(`${BASE}/api${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json();
  return { status: r.status, data };
}

const today = new Date().toISOString().slice(0, 10);

// 1. create with a paymentMode
let r = await j('POST', '/expenses', { amount: 123, date: today, category: CATEGORY, paymentMode: 'upi' });
console.assert(r.status === 201, 'create 201', r.status, r.data);
const id = r.data.data.expense._id;
console.assert(r.data.data.expense.paymentMode === 'upi', 'created paymentMode upi', r.data.data.expense.paymentMode);

// 2. create without → other
r = await j('POST', '/expenses', { amount: 45, date: today, category: CATEGORY });
console.assert(r.data.data.expense.paymentMode === 'other', 'default other', r.data.data.expense.paymentMode);

// 3. update it
r = await j('PUT', `/expenses/${id}`, { paymentMode: 'cash' });
console.assert(r.data.data.expense.paymentMode === 'cash', 'updated to cash', r.data.data.expense.paymentMode);

// 4. reject invalid
r = await j('POST', '/expenses', { amount: 1, date: today, category: CATEGORY, paymentMode: 'crypto' });
console.assert(r.status === 400, 'invalid rejected 400', r.status);

// 5. breakdown endpoint
const first = today.slice(0, 8) + '01';
r = await j('GET', `/analytics/payment-modes?from=${first}&to=${today}`);
console.assert(r.status === 200, 'breakdown 200', r.status);
console.assert(Array.isArray(r.data.data.breakdown), 'breakdown is array');
console.log('breakdown:', JSON.stringify(r.data.data, null, 2));

console.log('\nSMOKE OK');
