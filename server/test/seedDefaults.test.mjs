import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Account } from '../src/config/models/Account.js';
import { Category } from '../src/config/models/Category.js';
import { seedDefaultAccountAndAdjustmentCategory } from '../src/utils/seedDefaults.js';

// Node 16: top-level test hooks don't run — use top-level await for setup
// and a final test for teardown.
await connectTestDb();
await clearCollections();

test('seeds a default account and an Adjustment category', async () => {
  const userId = new mongoose.Types.ObjectId();
  await seedDefaultAccountAndAdjustmentCategory(userId, 'INR');
  const acc = await Account.findOne({ user: userId, isDefault: true });
  assert.equal(acc.name, 'Cash');
  assert.equal(acc.currency, 'INR');
  const cat = await Category.findOne({ user: userId, name: 'Adjustment' });
  assert.equal(cat.isDefault, true);
});

test('is idempotent', async () => {
  const userId = new mongoose.Types.ObjectId();
  await seedDefaultAccountAndAdjustmentCategory(userId, 'USD');
  await seedDefaultAccountAndAdjustmentCategory(userId, 'USD');
  assert.equal(await Account.countDocuments({ user: userId }), 1);
  assert.equal(await Category.countDocuments({ user: userId, name: 'Adjustment' }), 1);
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
