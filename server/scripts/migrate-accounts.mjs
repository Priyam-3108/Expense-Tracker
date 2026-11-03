// Idempotent. Seeds a default account + Adjustment category per user and
// backfills Expense.account for legacy rows.
//
// Run:   cd server && node scripts/migrate-accounts.mjs
// Env:   MONGO_URI (falls back to the app's configured connection if imported)
//
// Reverse (manual, not scripted):
//   Account.deleteMany({}); Transfer.deleteMany({});
//   Expense.updateMany({}, { $unset: { account: '', isAdjustment: '' } });
//   Category.deleteMany({ name: 'Adjustment', isDefault: true });

import mongoose from 'mongoose';
import { User } from '../src/config/models/User.js';
import { Expense } from '../src/config/models/Expense.js';
import { seedDefaultAccountAndAdjustmentCategory } from '../src/utils/seedDefaults.js';

export async function runMigration() {
  const users = await User.find({}).select('_id currency').lean();
  let seeded = 0;
  let backfilled = 0;

  for (const user of users) {
    const { account } = await seedDefaultAccountAndAdjustmentCategory(user._id, user.currency || 'USD');
    seeded += 1;

    const r = await Expense.updateMany(
      { user: user._id, $or: [{ account: null }, { account: { $exists: false } }] },
      { $set: { account: account._id } }
    );
    backfilled += r.modifiedCount || 0;
  }

  return { users: users.length, seeded, backfilled };
}

// Direct-run guard
if (import.meta.url === `file://${process.argv[1]}`) {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense_tracker';
  await mongoose.connect(uri);
  const summary = await runMigration();
  console.log('Migration complete:', summary);
  await mongoose.disconnect();
  process.exit(0);
}
