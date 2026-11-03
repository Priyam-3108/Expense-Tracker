import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { Category } from '../src/config/models/Category.js';
import { Account } from '../src/config/models/Account.js';
import { createExpense, getExpenses } from '../src/controllers/expenseController.js';

// Node 16: top-level test hooks don't run — use top-level await for setup
// and a final test for teardown.
await connectTestDb();
await clearCollections();

function mockRes() { return { statusCode: 200, body: null, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} }; }

async function seed(u) {
  const cat = await Category.create({ name: 'Food', user: u });
  const def = await Account.create({ user: u, name: 'Cash', isDefault: true });
  const bank = await Account.create({ user: u, name: 'Bank' });
  return { cat, def, bank };
}

test('createExpense persists an explicit account', async () => {
  const u = new mongoose.Types.ObjectId();
  const { cat, bank } = await seed(u);
  const res = mockRes();
  await createExpense({ user: { _id: u }, body: { amount: 10, date: '2026-09-10', category: String(cat._id), account: String(bank._id) } }, res);
  const saved = await Expense.findOne({ user: u });
  assert.equal(String(saved.account), String(bank._id));
});

test('createExpense falls back to the default account when account omitted', async () => {
  const u = new mongoose.Types.ObjectId();
  const { cat, def } = await seed(u);
  const res = mockRes();
  await createExpense({ user: { _id: u }, body: { amount: 10, date: '2026-09-10', category: String(cat._id) } }, res);
  const saved = await Expense.findOne({ user: u });
  assert.equal(String(saved.account), String(def._id));
});

test('createExpense rejects an account not owned by the user', async () => {
  const u = new mongoose.Types.ObjectId();
  const { cat } = await seed(u);
  const foreign = await Account.create({ user: new mongoose.Types.ObjectId(), name: 'Someone else' });
  const res = mockRes();
  await createExpense({ user: { _id: u }, body: { amount: 10, date: '2026-09-10', category: String(cat._id), account: String(foreign._id) } }, res);
  assert.equal(res.statusCode, 400);
});

test('getExpenses filters by account', async () => {
  const u = new mongoose.Types.ObjectId();
  const { cat, def, bank } = await seed(u);
  await Expense.create([
    { amount: 1, date: '2026-09-10', category: cat._id, user: u, account: def._id },
    { amount: 2, date: '2026-09-10', category: cat._id, user: u, account: bank._id },
  ]);
  const res = mockRes();
  await getExpenses({ user: { _id: u }, query: { account: String(bank._id) } }, res);
  const list = res.body.data.expenses;
  assert.equal(list.length, 1);
  assert.equal(list[0].amount, 2);
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
