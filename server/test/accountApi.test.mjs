import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Account } from '../src/config/models/Account.js';
import { Expense } from '../src/config/models/Expense.js';
import { listAccounts, createAccount, updateAccount, deleteAccount } from '../src/controllers/accountController.js';
import accountRoutes from '../src/routes/accounts.js';

// Node 16: top-level test hooks don't run — use top-level await for setup
// and a final test for teardown.
await connectTestDb();
await clearCollections();

function mockRes() {
  return { statusCode: 200, body: null, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} };
}
const user = () => new mongoose.Types.ObjectId();

test('createAccount then listAccounts returns computed balance', async () => {
  const u = user();
  let res = mockRes();
  await createAccount({ user: { _id: u }, body: { name: 'Bank', type: 'bank', openingBalance: 500 } }, res);
  assert.equal(res.statusCode, 201);
  const accId = res.body.data.account._id;

  await Expense.create({ amount: 100, date: '2026-09-10', category: user(), user: u, type: 'expense', account: accId });

  res = mockRes();
  await listAccounts({ user: { _id: u }, query: {} }, res);
  const acc = res.body.data.accounts.find((a) => String(a._id) === String(accId));
  assert.equal(acc.balance, 400);
  assert.equal(res.body.data.totalBalance, 400);
});

test('deleteAccount 403 when it has expenses', async () => {
  const u = user();
  const acc = await Account.create({ user: u, name: 'Has txns' });
  await Expense.create({ amount: 1, date: '2026-09-10', category: user(), user: u, account: acc._id });
  const res = mockRes();
  await deleteAccount({ user: { _id: u }, params: { id: String(acc._id) } }, res);
  assert.equal(res.statusCode, 403);
});

test('deleteAccount 403 for the default account', async () => {
  const u = user();
  const acc = await Account.create({ user: u, name: 'Cash', isDefault: true });
  const res = mockRes();
  await deleteAccount({ user: { _id: u }, params: { id: String(acc._id) } }, res);
  assert.equal(res.statusCode, 403);
});

test('updateAccount can archive a non-default empty account', async () => {
  const u = user();
  const acc = await Account.create({ user: u, name: 'Old' });
  const res = mockRes();
  await updateAccount({ user: { _id: u }, params: { id: String(acc._id) }, body: { archived: true } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.account.archived, true);
});

test('listAccounts hides archived unless includeArchived=true', async () => {
  const u = user();
  await Account.create({ user: u, name: 'Live' });
  await Account.create({ user: u, name: 'Gone', archived: true });
  let res = mockRes();
  await listAccounts({ user: { _id: u }, query: {} }, res);
  assert.equal(res.body.data.accounts.length, 1);
  res = mockRes();
  await listAccounts({ user: { _id: u }, query: { includeArchived: 'true' } }, res);
  assert.equal(res.body.data.accounts.length, 2);
});

test('accountRoutes registers the CRUD verbs', () => {
  const paths = accountRoutes.stack.filter((l) => l.route).map((l) => `${Object.keys(l.route.methods)[0].toUpperCase()} ${l.route.path}`);
  assert.ok(paths.includes('GET /'));
  assert.ok(paths.includes('POST /'));
  assert.ok(paths.includes('PUT /:id'));
  assert.ok(paths.includes('DELETE /:id'));
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
