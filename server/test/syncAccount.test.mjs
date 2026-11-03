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

test('syncExpenses falls back to the default account when account is omitted', async () => {
  const u = new mongoose.Types.ObjectId();
  const cat = await Category.create({ name: 'Food', user: u });
  const def = await Account.create({ user: u, name: 'Default', isDefault: true });
  const req = { user: { _id: u }, body: { expenses: [
    { client_uuid: 'sa-2', amount: 5, date: '2026-09-10', category: String(cat._id), type: 'expense' },
  ] } };
  const res = mockRes();
  await syncExpenses(req, res);
  const saved = await Expense.findOne({ client_uuid: 'sa-2' });
  assert.equal(String(saved.account), String(def._id));
});

test('syncExpenses rejects a foreign user account id on create', async () => {
  const u = new mongoose.Types.ObjectId();
  const otherUser = new mongoose.Types.ObjectId();
  const cat = await Category.create({ name: 'Food', user: u });
  const foreignAcc = await Account.create({ user: otherUser, name: 'NotMine' });
  const req = { user: { _id: u }, body: { expenses: [
    { client_uuid: 'sa-3', amount: 5, date: '2026-09-10', category: String(cat._id), type: 'expense', account: String(foreignAcc._id) },
  ] } };
  const res = mockRes();
  await syncExpenses(req, res);
  assert.equal(res.body.results[0].status, 'FAILED');
  assert.equal(res.body.results[0].error, 'Invalid account');
  const saved = await Expense.findOne({ client_uuid: 'sa-3' });
  assert.equal(saved, null);
});

test('syncExpenses rejects a foreign user account id on edit', async () => {
  const u = new mongoose.Types.ObjectId();
  const otherUser = new mongoose.Types.ObjectId();
  const cat = await Category.create({ name: 'Food', user: u });
  const acc = await Account.create({ user: u, name: 'Mine' });
  const foreignAcc = await Account.create({ user: otherUser, name: 'NotMine' });
  const existing = await Expense.create({ user: u, amount: 10, date: '2026-09-10', category: cat._id, type: 'expense', account: acc._id, client_uuid: 'sa-4' });

  const req = { user: { _id: u }, body: { expenses: [
    { client_uuid: 'edit-sa-4', _id: String(existing._id), amount: 10, date: '2026-09-10', category: String(cat._id), type: 'expense', account: String(foreignAcc._id) },
  ] } };
  const res = mockRes();
  await syncExpenses(req, res);
  assert.equal(res.body.results[0].status, 'FAILED');
  assert.equal(res.body.results[0].error, 'Invalid account');

  const unchanged = await Expense.findById(existing._id);
  assert.equal(String(unchanged.account), String(acc._id));
});

test('syncExpenses edit without account field leaves existing account untouched', async () => {
  const u = new mongoose.Types.ObjectId();
  const cat = await Category.create({ name: 'Food', user: u });
  const acc = await Account.create({ user: u, name: 'Mine' });
  const existing = await Expense.create({ user: u, amount: 10, date: '2026-09-10', category: cat._id, type: 'expense', account: acc._id, client_uuid: 'sa-5' });

  const req = { user: { _id: u }, body: { expenses: [
    { client_uuid: 'edit-sa-5', _id: String(existing._id), amount: 15, date: '2026-09-10', category: String(cat._id), type: 'expense' },
  ] } };
  const res = mockRes();
  await syncExpenses(req, res);
  assert.equal(res.body.results[0].status, 'SYNCED');

  const unchanged = await Expense.findById(existing._id);
  assert.equal(String(unchanged.account), String(acc._id));
  assert.equal(unchanged.amount, 15);
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
