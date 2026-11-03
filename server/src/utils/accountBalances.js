import mongoose from 'mongoose';
import { Account } from '../config/models/Account.js';
import { Expense } from '../config/models/Expense.js';
import { Transfer } from '../config/models/Transfer.js';

export async function computeAccountBalances(userId) {
  const uid = new mongoose.Types.ObjectId(userId);

  const accounts = await Account.find({ user: uid }).select('_id openingBalance').lean();
  const balances = new Map(accounts.map((a) => [String(a._id), a.openingBalance || 0]));

  const expenseAgg = await Expense.aggregate([
    { $match: { user: uid, account: { $ne: null } } },
    { $group: { _id: { account: '$account', type: '$type' }, total: { $sum: '$amount' } } },
  ]);
  for (const row of expenseAgg) {
    const key = String(row._id.account);
    if (!balances.has(key)) continue;
    const sign = row._id.type === 'income' ? 1 : -1;
    balances.set(key, balances.get(key) + sign * row.total);
  }

  const transferAgg = await Transfer.aggregate([
    { $match: { user: uid } },
    {
      $facet: {
        out: [{ $group: { _id: '$fromAccount', total: { $sum: '$amount' } } }],
        in: [{ $group: { _id: '$toAccount', total: { $sum: '$amount' } } }],
      },
    },
  ]);
  const { out = [], in: inn = [] } = transferAgg[0] || {};
  for (const row of out) {
    const key = String(row._id);
    if (balances.has(key)) balances.set(key, balances.get(key) - row.total);
  }
  for (const row of inn) {
    const key = String(row._id);
    if (balances.has(key)) balances.set(key, balances.get(key) + row.total);
  }

  return balances;
}
