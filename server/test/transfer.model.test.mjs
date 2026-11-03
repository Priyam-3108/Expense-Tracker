import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Transfer } from '../src/config/models/Transfer.js';

// Node 16: top-level test hooks don't run — use top-level await for setup
// and a final test for teardown.
await connectTestDb();
await clearCollections();

const id = () => new mongoose.Types.ObjectId();

test('Transfer requires distinct from/to accounts', async () => {
  const acc = id();
  const t = new Transfer({ user: id(), fromAccount: acc, toAccount: acc, amount: 10, date: '2026-09-10' });
  await assert.rejects(() => t.validate(), /same account|distinct|different/i);
});

test('Transfer enforces min amount', async () => {
  const t = new Transfer({ user: id(), fromAccount: id(), toAccount: id(), amount: 0, date: '2026-09-10' });
  await assert.rejects(() => t.validate(), /amount/i);
});

test('Transfer accepts a valid doc', async () => {
  const t = await Transfer.create({ user: id(), fromAccount: id(), toAccount: id(), amount: 500, date: '2026-09-10', note: 'rent' });
  assert.equal(t.amount, 500);
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
