import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';

// Node 16: top-level test hooks don't run — use top-level await for setup
// and a final test for teardown.
await connectTestDb();
await clearCollections();

const base = {
  amount: 100,
  date: '2026-09-10',
  category: new mongoose.Types.ObjectId(),
  user: new mongoose.Types.ObjectId(),
};

test('paymentMode defaults to "other" when omitted', async () => {
  const e = await Expense.create({ ...base });
  assert.equal(e.paymentMode, 'other');
});

test('paymentMode accepts a valid enum value', async () => {
  const e = await Expense.create({ ...base, paymentMode: 'upi' });
  assert.equal(e.paymentMode, 'upi');
});

test('paymentMode rejects an invalid value on validation', async () => {
  const e = new Expense({ ...base, paymentMode: 'crypto' });
  await assert.rejects(() => e.validate(), /paymentMode/);
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
