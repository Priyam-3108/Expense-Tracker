import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Account } from '../src/config/models/Account.js';

// Node 16: top-level test hooks don't run — use top-level await for setup
// and a final test for teardown.
await connectTestDb();
await clearCollections();

const u = () => new mongoose.Types.ObjectId();

test('Account applies defaults', async () => {
  const a = await Account.create({ user: u(), name: 'Wallet' });
  assert.equal(a.type, 'cash');
  assert.equal(a.openingBalance, 0);
  assert.equal(a.isDefault, false);
  assert.equal(a.archived, false);
});

test('Account rejects an invalid type', async () => {
  const a = new Account({ user: u(), name: 'X', type: 'crypto' });
  await assert.rejects(() => a.validate(), /type/);
});

test('only one default account per user (partial unique index)', async () => {
  await Account.syncIndexes();
  const user = u();
  await Account.create({ user, name: 'A', isDefault: true });
  await assert.rejects(
    () => Account.create({ user, name: 'B', isDefault: true }),
    /duplicate key|E11000/
  );
  // a non-default second account is fine
  await Account.create({ user, name: 'C', isDefault: false });
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
