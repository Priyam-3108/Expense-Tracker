import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Account } from '../src/config/models/Account.js';
import { Transfer } from '../src/config/models/Transfer.js';
import { createTransfer, listTransfers, syncTransfers } from '../src/controllers/transferController.js';
import transferRoutes from '../src/routes/transfers.js';

// Node 16: top-level test hooks don't run — use top-level await for setup
// and a final test for teardown.
await connectTestDb();
await clearCollections();

function mockRes() {
  return { statusCode: 200, body: null, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} };
}

async function twoAccounts(u, curA = 'INR', curB = 'INR') {
  const a = await Account.create({ user: u, name: 'A', currency: curA });
  const b = await Account.create({ user: u, name: 'B', currency: curB });
  return { a, b };
}

test('createTransfer succeeds for same-currency distinct accounts', async () => {
  const u = new mongoose.Types.ObjectId();
  const { a, b } = await twoAccounts(u);
  const res = mockRes();
  await createTransfer({ user: { _id: u }, body: { fromAccount: String(a._id), toAccount: String(b._id), amount: 250, date: '2026-09-10' } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(await Transfer.countDocuments({ user: u }), 1);
});

test('createTransfer 400 on same account', async () => {
  const u = new mongoose.Types.ObjectId();
  const { a } = await twoAccounts(u);
  const res = mockRes();
  await createTransfer({ user: { _id: u }, body: { fromAccount: String(a._id), toAccount: String(a._id), amount: 10, date: '2026-09-10' } }, res);
  assert.equal(res.statusCode, 400);
});

test('createTransfer 400 on currency mismatch', async () => {
  const u = new mongoose.Types.ObjectId();
  const { a, b } = await twoAccounts(u, 'INR', 'USD');
  const res = mockRes();
  await createTransfer({ user: { _id: u }, body: { fromAccount: String(a._id), toAccount: String(b._id), amount: 10, date: '2026-09-10' } }, res);
  assert.equal(res.statusCode, 400);
});

test('createTransfer 400 on malformed account id (not a CastError 500)', async () => {
  const u = new mongoose.Types.ObjectId();
  const { a } = await twoAccounts(u);
  const res = mockRes();
  await createTransfer({ user: { _id: u }, body: { fromAccount: String(a._id), toAccount: 'not-a-valid-object-id', amount: 10, date: '2026-09-10' } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test('syncTransfers dedupes by client_uuid', async () => {
  const u = new mongoose.Types.ObjectId();
  const { a, b } = await twoAccounts(u);
  const body = { transfers: [{ client_uuid: 't-1', fromAccount: String(a._id), toAccount: String(b._id), amount: 30, date: '2026-09-10' }] };
  let res = mockRes();
  await syncTransfers({ user: { _id: u }, body }, res);
  res = mockRes();
  await syncTransfers({ user: { _id: u }, body }, res);
  assert.equal(await Transfer.countDocuments({ user: u, client_uuid: 't-1' }), 1);
});

test('transferRoutes registers verbs', () => {
  const has = (m, p) => transferRoutes.stack.some((l) => l.route && l.route.path === p && l.route.methods[m]);
  assert.ok(has('get', '/'));
  assert.ok(has('post', '/'));
  assert.ok(has('post', '/sync'));
  assert.ok(has('delete', '/:id'));
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
