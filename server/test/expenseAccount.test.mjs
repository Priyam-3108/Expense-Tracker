import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { expenseSchema, accountSchema, transferSchema } from '../src/middleware/validation.js';

// Node 16: top-level test hooks don't run — use top-level await for setup
// and a final test for teardown.
await connectTestDb();
await clearCollections();

const id = () => new mongoose.Types.ObjectId();

test('Expense.account defaults to null, isAdjustment to false', async () => {
  const e = await Expense.create({ amount: 5, date: '2026-09-10', category: id(), user: id() });
  assert.equal(e.account, null);
  assert.equal(e.isAdjustment, false);
});

test('expenseSchema accepts optional account', () => {
  const parsed = expenseSchema.parse({ amount: 1, category: 'c', account: 'a1' });
  assert.equal(parsed.account, 'a1');
  const parsed2 = expenseSchema.parse({ amount: 1, category: 'c' });
  assert.equal(parsed2.account, undefined);
});

test('accountSchema validates name + type', () => {
  assert.equal(accountSchema.parse({ name: 'Bank', type: 'bank' }).type, 'bank');
  assert.throws(() => accountSchema.parse({ name: 'X', type: 'nope' }));
  assert.throws(() => accountSchema.parse({ type: 'bank' })); // name required
});

test('transferSchema validates', () => {
  const ok = transferSchema.parse({ fromAccount: 'a', toAccount: 'b', amount: 10, date: '2026-09-10' });
  assert.equal(ok.amount, 10);
  assert.throws(() => transferSchema.parse({ fromAccount: 'a', toAccount: 'b', amount: 0, date: '2026-09-10' }));
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
