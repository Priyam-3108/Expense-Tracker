import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { Account } from '../src/config/models/Account.js';
import { Category } from '../src/config/models/Category.js';
import { syncExpenses } from '../src/controllers/syncController.js';

// Node 16: top-level test hooks don't run — use top-level await for setup
// and a final test for teardown.
await connectTestDb();
await clearCollections();

function mockRes() { return { statusCode: 200, body: null, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} }; }

test('syncExpenses persists account from the payload', async () => {
  const u = new mongoose.Types.ObjectId();
  const cat = await Category.create({ name: 'Food', user: u });
  const acc = await Account.create({ user: u, name: 'Cash' });
  const req = { user: { _id: u }, body: { expenses: [
    { client_uuid: 'sa-1', amount: 9, date: '2026-09-10', category: String(cat._id), type: 'expense', account: String(acc._id) },
  ] } };
  const res = mockRes();
  await syncExpenses(req, res);
  const saved = await Expense.findOne({ client_uuid: 'sa-1' });
  assert.equal(String(saved.account), String(acc._id));
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
