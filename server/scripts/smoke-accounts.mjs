// server/scripts/smoke-accounts.mjs
// Usage: BASE=http://localhost:5000 TOKEN=<jwt> CATEGORY=<catId> node scripts/smoke-accounts.mjs
const BASE = process.env.BASE || 'http://localhost:5000';
const TOKEN = process.env.TOKEN;
const CATEGORY = process.env.CATEGORY;
if (!TOKEN || !CATEGORY) { console.error('Set TOKEN and CATEGORY'); process.exit(1); }
const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };
const j = async (m, p, b) => {
  const r = await fetch(`${BASE}/api${p}`, { method: m, headers: h, body: b ? JSON.stringify(b) : undefined });
  return { status: r.status, data: await r.json() };
};
const today = new Date().toISOString().slice(0, 10);

let r = await j('GET', '/accounts');
console.assert(r.status === 200 && Array.isArray(r.data.data.accounts), 'list accounts', r.status);
let def = r.data.data.accounts.find((a) => a.isDefault);
console.assert(def, 'default account exists (migration/seed ran)');

r = await j('POST', '/accounts', { name: 'Smoke Bank', type: 'bank', openingBalance: 1000, currency: def.currency });
console.assert(r.status === 201, 'create account', r.status);
const bank = r.data.data.account._id;

r = await j('POST', '/expenses', { amount: 200, date: today, category: CATEGORY, account: bank });
console.assert(r.status === 201 && r.data.data.expense.account === bank, 'expense on account', r.data.data.expense.account);

r = await j('POST', '/transfers', { fromAccount: bank, toAccount: def._id, amount: 300, date: today });
console.assert(r.status === 201, 'transfer', r.status, r.data);

r = await j('GET', '/accounts');
const bankBal = r.data.data.accounts.find((a) => String(a._id) === String(bank)).balance;
console.assert(bankBal === 500, 'bank balance 1000 - 200 - 300 = 500', bankBal);

r = await j('POST', `/accounts/${bank}/reconcile`, { targetBalance: 500 });
console.assert(r.data.data.adjusted === false, 'reconcile no-op on equal', r.data.data);

r = await j('POST', `/accounts/${bank}/reconcile`, { targetBalance: 600 });
console.assert(r.data.data.adjusted === true && r.data.data.delta === 100, 'reconcile +100', r.data.data);

r = await j('GET', `/accounts/${bank}/statement`);
console.assert(Array.isArray(r.data.data.entries), 'statement entries', r.data.data);
console.log('statement kinds:', r.data.data.entries.map((e) => e.kind).join(', '));

r = await j('DELETE', `/accounts/${bank}`);
console.assert(r.status === 403, 'delete blocked (has txns)', r.status);

console.log('\nSMOKE OK');
