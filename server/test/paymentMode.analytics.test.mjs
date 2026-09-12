// server/test/paymentMode.analytics.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { getPaymentModeBreakdown } from '../src/controllers/analyticsController.js';

// Node 16: top-level test hooks don't run — top-level await for setup, final test for teardown.
await connectTestDb();
await clearCollections();

function mockRes() {
  return {
    statusCode: 200, body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

async function seed(userId) {
  const cat = new mongoose.Types.ObjectId();
  await Expense.create([
    { amount: 100, date: '2026-09-05', category: cat, user: userId, type: 'expense', paymentMode: 'upi' },
    { amount: 50,  date: '2026-09-06', category: cat, user: userId, type: 'expense', paymentMode: 'upi' },
    { amount: 200, date: '2026-09-07', category: cat, user: userId, type: 'expense', paymentMode: 'cash' },
    { amount: 999, date: '2026-09-08', category: cat, user: userId, type: 'income',  paymentMode: 'upi' },  // excluded (income)
    { amount: 30,  date: '2026-08-31', category: cat, user: userId, type: 'expense', paymentMode: 'card' }, // excluded (out of range)
  ]);
  // one legacy row with no paymentMode field at all
  await Expense.collection.insertOne({
    amount: 40, date: '2026-09-09', category: cat, user: userId, type: 'expense',
    createdAt: new Date(), updatedAt: new Date(),
  });
}

test('breakdown groups by paymentMode, expense-only, in range, sorted by total', async () => {
  const userId = new mongoose.Types.ObjectId();
  await seed(userId);
  const req = { user: { _id: userId }, query: { from: '2026-09-01', to: '2026-09-30' } };
  const res = mockRes();
  await getPaymentModeBreakdown(req, res);

  assert.equal(res.statusCode, 200);
  const { breakdown, totalSpent, from, to } = res.body.data;
  assert.equal(from, '2026-09-01');
  assert.equal(to, '2026-09-30');
  // cash 200, upi 150, other 40  → sorted desc
  assert.deepEqual(breakdown.map((b) => b.paymentMode), ['cash', 'upi', 'other']);
  assert.equal(breakdown[0].total, 200);
  assert.equal(breakdown[1].total, 150);
  assert.equal(breakdown[1].count, 2);
  assert.equal(breakdown[2].paymentMode, 'other'); // legacy row with missing field
  assert.equal(totalSpent, 390);
});

test('breakdown returns empty result for a range with no expenses', async () => {
  const userId = new mongoose.Types.ObjectId();
  const req = { user: { _id: userId }, query: { from: '2020-01-01', to: '2020-01-31' } };
  const res = mockRes();
  await getPaymentModeBreakdown(req, res);
  assert.deepEqual(res.body.data.breakdown, []);
  assert.equal(res.body.data.totalSpent, 0);
});

test('breakdown returns 400 for malformed/inverted from-to instead of a silent wrong result', async () => {
  const userId = new mongoose.Types.ObjectId();

  const badFormat = { user: { _id: userId }, query: { from: 'not-a-date', to: '2026-09-30' } };
  const res1 = mockRes();
  await getPaymentModeBreakdown(badFormat, res1);
  assert.equal(res1.statusCode, 400);
  assert.equal(res1.body.message, 'Invalid date format. Use YYYY-MM-DD');

  const inverted = { user: { _id: userId }, query: { from: '2026-09-30', to: '2026-09-01' } };
  const res2 = mockRes();
  await getPaymentModeBreakdown(inverted, res2);
  assert.equal(res2.statusCode, 400);
  assert.equal(res2.body.message, 'Start date cannot be after end date');
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
