import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Account } from '../src/config/models/Account.js';
import { Expense } from '../src/config/models/Expense.js';
import { Transfer } from '../src/config/models/Transfer.js';
import { computeAccountBalances } from '../src/utils/accountBalances.js';

// Node 16: top-level test hooks don't run — use top-level await for setup
// and a final test for teardown.
await connectTestDb();
await clearCollections();

test('balance = opening + income - expense + transfersIn - transfersOut', async () => {
  const user = new mongoose.Types.ObjectId();
  const cat = new mongoose.Types.ObjectId();
  const a = await Account.create({ user, name: 'A', openingBalance: 1000 });
  const b = await Account.create({ user, name: 'B', openingBalance: 0 });

  await Expense.create([
    { amount: 300, date: '2026-09-01', category: cat, user, type: 'expense', account: a._id },
    { amount: 500, date: '2026-09-02', category: cat, user, type: 'income',  account: a._id },
    { amount: 50,  date: '2026-09-03', category: cat, user, type: 'expense', account: b._id },
  ]);
  await Transfer.create([
    { user, fromAccount: a._id, toAccount: b._id, amount: 200, date: '2026-09-04' },
  ]);

  const balances = await computeAccountBalances(user);
  // A: 1000 + 500 - 300 - 200 = 1000
  assert.equal(balances.get(String(a._id)), 1000);
  // B: 0 - 50 + 200 = 150
  assert.equal(balances.get(String(b._id)), 150);
});

test('account with no activity returns its opening balance', async () => {
  const user = new mongoose.Types.ObjectId();
  const a = await Account.create({ user, name: 'Solo', openingBalance: 42 });
  const balances = await computeAccountBalances(user);
  assert.equal(balances.get(String(a._id)), 42);
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
