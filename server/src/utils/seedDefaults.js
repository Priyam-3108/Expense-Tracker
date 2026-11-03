import { Account } from '../config/models/Account.js';
import { Category } from '../config/models/Category.js';

export async function seedDefaultAccountAndAdjustmentCategory(userId, currency = 'USD') {
  let account = await Account.findOne({ user: userId, isDefault: true });
  if (!account) {
    account = await Account.create({
      user: userId,
      name: 'Cash',
      type: 'cash',
      openingBalance: 0,
      currency,
      isDefault: true,
    });
  }

  let category = await Category.findOne({ user: userId, name: 'Adjustment' });
  if (!category) {
    category = await Category.create({
      user: userId,
      name: 'Adjustment',
      color: '#64748B',
      icon: '⚖️',
      isDefault: true,
    });
  }

  return { account, category };
}
