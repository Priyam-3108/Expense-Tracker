import test from 'node:test';
import assert from 'node:assert/strict';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { User } from '../src/config/models/User.js';
import { Account } from '../src/config/models/Account.js';
import { Category } from '../src/config/models/Category.js';
import { Expense } from '../src/config/models/Expense.js';
import { runMigration } from '../scripts/migrate-accounts.mjs';

// Node 16: top-level test hooks don't run — use top-level await for setup
// and a final test for teardown.
await connectTestDb();
await clearCollections();

test('migration seeds defaults and backfills expense.account, idempotently', async () => {
  const user = await User.create({ name: 'Legacy', email: 'legacy@example.com', password: 'secret123', currency: 'INR' });
  const cat = await Category.create({ user: user._id, name: 'Food' });
  await Expense.create({ user: user._id, amount: 10, date: '2026-09-01', category: cat._id }); // account: null

  await runMigration();

  const def = await Account.findOne({ user: user._id, isDefault: true });
  assert.ok(def, 'default account created');
  assert.equal(def.currency, 'INR');
  assert.ok(await Category.findOne({ user: user._id, name: 'Adjustment' }));
  const exp = await Expense.findOne({ user: user._id });
  assert.equal(String(exp.account), String(def._id));

  // run again — nothing new
  await runMigration();
  assert.equal(await Account.countDocuments({ user: user._id }), 1);
  assert.equal(await Category.countDocuments({ user: user._id, name: 'Adjustment' }), 1);
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
