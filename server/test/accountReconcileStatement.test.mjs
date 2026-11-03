import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Account } from '../src/config/models/Account.js';
import { Category } from '../src/config/models/Category.js';
import { Expense } from '../src/config/models/Expense.js';
import { Transfer } from '../src/config/models/Transfer.js';
import { reconcileAccount, accountStatement } from '../src/controllers/accountController.js';

// Node 16: top-level test hooks don't run — use top-level await for setup
// and a final test for teardown.
await connectTestDb();
await clearCollections();

function mockRes() { return { statusCode: 200, body: null, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} }; }

test('reconcile creates an income adjustment when target is higher', async () => {
  const u = new mongoose.Types.ObjectId();
  await Category.create({ user: u, name: 'Adjustment', isDefault: true });
  const acc = await Account.create({ user: u, name: 'Cash', openingBalance: 100 });
  const res = mockRes();
  await reconcileAccount({ user: { _id: u }, params: { id: String(acc._id) }, body: { targetBalance: 250 } }, res);
  assert.equal(res.body.data.adjusted, true);
  assert.equal(res.body.data.delta, 150);
  const adj = await Expense.findOne({ user: u, isAdjustment: true });
  assert.equal(adj.type, 'income');
  assert.equal(adj.amount, 150);
  assert.equal(String(adj.account), String(acc._id));
});

test('reconcile with equal target creates no row', async () => {
  const u = new mongoose.Types.ObjectId();
  await Category.create({ user: u, name: 'Adjustment', isDefault: true });
  const acc = await Account.create({ user: u, name: 'Cash', openingBalance: 100 });
  const res = mockRes();
  await reconcileAccount({ user: { _id: u }, params: { id: String(acc._id) }, body: { targetBalance: 100 } }, res);
  assert.equal(res.body.data.adjusted, false);
  assert.equal(await Expense.countDocuments({ user: u }), 0);
});

test('statement merges expenses and transfers for the account, sorted by date', async () => {
  const u = new mongoose.Types.ObjectId();
  const cat = await Category.create({ user: u, name: 'Food' });
  const a = await Account.create({ user: u, name: 'A' });
  const b = await Account.create({ user: u, name: 'B' });
  await Expense.create({ user: u, amount: 40, date: '2026-09-02', category: cat._id, account: a._id, type: 'expense' });
  await Transfer.create({ user: u, fromAccount: a._id, toAccount: b._id, amount: 100, date: '2026-09-01' });
  await Transfer.create({ user: u, fromAccount: b._id, toAccount: a._id, amount: 30, date: '2026-09-03' });

  const res = mockRes();
  await accountStatement({ user: { _id: u }, params: { id: String(a._id) }, query: {} }, res);
  const entries = res.body.data.entries;
  assert.deepEqual(entries.map((e) => e.date), ['2026-09-01', '2026-09-02', '2026-09-03']);
  assert.deepEqual(entries.map((e) => e.kind), ['transfer-out', 'expense', 'transfer-in']);
});

test('statement does not crash when a transfer counterpart account was deleted', async () => {
  const u = new mongoose.Types.ObjectId();
  const a = await Account.create({ user: u, name: 'A' });
  const b = await Account.create({ user: u, name: 'B' });
  await Transfer.create({ user: u, fromAccount: a._id, toAccount: b._id, amount: 50, date: '2026-09-05' });

  // Simulate an orphaned ref: delete the counterpart account directly,
  // bypassing deleteAccount's guard (which would normally refuse this
  // because the account has transfer history).
  await Account.deleteOne({ _id: b._id });

  const res = mockRes();
  await accountStatement({ user: { _id: u }, params: { id: String(a._id) }, query: {} }, res);
  assert.equal(res.statusCode, 200);
  const entries = res.body.data.entries;
  assert.equal(entries.length, 1);
  // fromAccount (account A) still exists, so it populates fine and the
  // outgoing check (`t.fromAccount?._id ?? t.fromAccount` === account A's id)
  // matches normally, giving 'transfer-out'. It's toAccount (account B) that
  // is the dangling ref here; populate() resolves it to null, so
  // counterparty (`t.toAccount?.name`) is undefined below rather than
  // throwing — that's the crash this test actually guards against, not a
  // fallback on fromAccount's own id.
  assert.equal(entries[0].kind, 'transfer-out');
  assert.equal(entries[0].counterparty, undefined);
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
