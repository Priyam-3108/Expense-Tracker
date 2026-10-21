import test from 'node:test';
import assert from 'node:assert/strict';
import { clampWeeks, trailingWindow } from '../src/utils/dateWindow.js';

test('clampWeeks defaults to 16', () => {
  assert.equal(clampWeeks(undefined), 16);
  assert.equal(clampWeeks('abc'), 16);
  assert.equal(clampWeeks(null), 16);
});

test('clampWeeks bounds to [1, 53]', () => {
  assert.equal(clampWeeks(0), 1);
  assert.equal(clampWeeks(-5), 1);
  assert.equal(clampWeeks(999), 53);
  assert.equal(clampWeeks(53), 53);
});

test('clampWeeks parses numeric strings and floors floats', () => {
  assert.equal(clampWeeks('20'), 20);
  assert.equal(clampWeeks(12.9), 12);
});

test('trailingWindow computes an inclusive N-week window ending today', () => {
  const today = new Date('2026-09-10T12:00:00');
  const { from, to } = trailingWindow(16, today);
  assert.equal(to, '2026-09-10');
  // 16*7 - 1 = 111 days back → 2026-05-22
  assert.equal(from, '2026-05-22');
});

test('trailingWindow for 1 week is a 7-day window', () => {
  const today = new Date('2026-09-10T00:00:00');
  const { from, to } = trailingWindow(1, today);
  assert.equal(to, '2026-09-10');
  assert.equal(from, '2026-09-04');
});

import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { getDailyActivity } from '../src/controllers/analyticsController.js';

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

test('getDailyActivity returns sparse expense-only daily totals sorted ascending', async () => {
  const userId = new mongoose.Types.ObjectId();
  const cat = new mongoose.Types.ObjectId();
  const today = new Date();
  const ymd = (d) => d.toISOString().slice(0, 10);
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return ymd(d); };

  await Expense.create([
    { amount: 100, date: daysAgo(1), category: cat, user: userId, type: 'expense' },
    { amount: 50,  date: daysAgo(1), category: cat, user: userId, type: 'expense' },
    { amount: 200, date: daysAgo(3), category: cat, user: userId, type: 'expense' },
    { amount: 999, date: daysAgo(2), category: cat, user: userId, type: 'income' },   // excluded
    { amount: 5,   date: daysAgo(400), category: cat, user: userId, type: 'expense' }, // out of default window
  ]);

  const req = { user: { _id: userId }, query: {} };
  const res = mockRes();
  await getDailyActivity(req, res);

  assert.equal(res.statusCode, 200);
  const { days, weeks } = res.body.data;
  assert.equal(weeks, 16);
  assert.deepEqual(days.map((d) => d.date), [daysAgo(3), daysAgo(1)]);
  assert.equal(days[0].expenseTotal, 200);
  assert.equal(days[0].count, 1);
  assert.equal(days[1].expenseTotal, 150);
  assert.equal(days[1].count, 2);
});

test('getDailyActivity clamps weeks and never 400s', async () => {
  const userId = new mongoose.Types.ObjectId();
  let res = mockRes();
  await getDailyActivity({ user: { _id: userId }, query: { weeks: '999' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.weeks, 53);

  res = mockRes();
  await getDailyActivity({ user: { _id: userId }, query: { weeks: 'nope' } }, res);
  assert.equal(res.body.data.weeks, 16);

  res = mockRes();
  await getDailyActivity({ user: { _id: userId }, query: { weeks: '0' } }, res);
  assert.equal(res.body.data.weeks, 1);
});

test('getDailyActivity returns empty days for a user with no expenses', async () => {
  const res = mockRes();
  await getDailyActivity({ user: { _id: new mongoose.Types.ObjectId() }, query: {} }, res);
  assert.deepEqual(res.body.data.days, []);
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
