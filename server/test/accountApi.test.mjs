import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Account } from '../src/config/models/Account.js';
import { Expense } from '../src/config/models/Expense.js';
import { Transfer } from '../src/config/models/Transfer.js';
import { listAccounts, createAccount, updateAccount, deleteAccount, reconcileAccount, accountStatement } from '../src/controllers/accountController.js';
import { accountSchema } from '../src/middleware/validation.js';
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

test('updateAccount, deleteAccount, reconcileAccount, accountStatement 400 on malformed id', async () => {
  const u = user();
  const res1 = mockRes();
  await updateAccount({ user: { _id: u }, params: { id: 'not-an-id' }, body: { name: 'X' } }, res1);
  assert.equal(res1.statusCode, 400);

  const res2 = mockRes();
  await deleteAccount({ user: { _id: u }, params: { id: 'not-an-id' } }, res2);
  assert.equal(res2.statusCode, 400);

  const res3 = mockRes();
  await reconcileAccount({ user: { _id: u }, params: { id: 'not-an-id' }, body: { targetBalance: 10 } }, res3);
  assert.equal(res3.statusCode, 400);

  const res4 = mockRes();
  await accountStatement({ user: { _id: u }, params: { id: 'not-an-id' }, query: {} }, res4);
  assert.equal(res4.statusCode, 400);
});

test('accountSchema.partial() rejects an invalid type enum', () => {
  const result = accountSchema.partial().safeParse({ type: 'crypto' });
  assert.equal(result.success, false);
});

test('updateAccount 400 when changing currency on an account with existing transfers', async () => {
  const u = user();
  const a = await Account.create({ user: u, name: 'A', currency: 'INR' });
  const b = await Account.create({ user: u, name: 'B', currency: 'INR' });
  await Transfer.create({ user: u, fromAccount: a._id, toAccount: b._id, amount: 20, date: '2026-09-10' });

  const res = mockRes();
  await updateAccount({ user: { _id: u }, params: { id: String(a._id) }, body: { currency: 'USD' } }, res);
  assert.equal(res.statusCode, 400);
});

test('updateAccount allows setting currency to the same value even with transfers', async () => {
  const u = user();
  const a = await Account.create({ user: u, name: 'A', currency: 'INR' });
  const b = await Account.create({ user: u, name: 'B', currency: 'INR' });
  await Transfer.create({ user: u, fromAccount: a._id, toAccount: b._id, amount: 20, date: '2026-09-10' });

  const res = mockRes();
  await updateAccount({ user: { _id: u }, params: { id: String(a._id) }, body: { currency: 'INR' } }, res);
  assert.equal(res.statusCode, 200);
});

test('updateAccount allows changing currency when the account has no transfers', async () => {
  const u = user();
  const a = await Account.create({ user: u, name: 'Lonely', currency: 'INR' });

  const res = mockRes();
  await updateAccount({ user: { _id: u }, params: { id: String(a._id) }, body: { currency: 'USD' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.account.currency, 'USD');
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
