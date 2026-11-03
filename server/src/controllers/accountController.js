import { Account, Expense, Transfer } from '../config/models/index.js';
import { computeAccountBalances } from '../utils/accountBalances.js';

export const listAccounts = async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const filter = { user: req.user._id };
    if (!includeArchived) filter.archived = false;

    const [accounts, balances] = await Promise.all([
      Account.find(filter).sort({ isDefault: -1, createdAt: 1 }).lean(),
      computeAccountBalances(req.user._id),
    ]);

    const withBalance = accounts.map((a) => ({ ...a, balance: balances.get(String(a._id)) ?? (a.openingBalance || 0) }));
    const totalBalance = withBalance
      .filter((a) => !a.archived)
      .reduce((s, a) => s + a.balance, 0);

    res.json({ success: true, data: { accounts: withBalance, totalBalance } });
  } catch (error) {
    console.error('List accounts error:', error);
    res.status(500).json({ success: false, message: 'Failed to list accounts', error: error.message });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { name, type, openingBalance, currency } = req.body;
    const account = await Account.create({
      user: req.user._id,
      name,
      type: type || 'cash',
      openingBalance: typeof openingBalance === 'number' ? openingBalance : 0,
      currency: currency || req.user.currency || 'USD',
    });
    res.status(201).json({ success: true, message: 'Account created', data: { account } });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ success: false, message: 'Failed to create account', error: error.message });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const { name, type, openingBalance, currency, archived } = req.body;
    if (name !== undefined) account.name = name;
    if (type !== undefined) account.type = type;
    if (openingBalance !== undefined) account.openingBalance = openingBalance;
    if (currency !== undefined) account.currency = currency;

    if (archived === true) {
      if (account.isDefault) {
        return res.status(400).json({ success: false, message: 'The default account cannot be archived' });
      }
      account.archived = true;
    } else if (archived === false) {
      account.archived = false;
    }

    await account.save();
    res.json({ success: true, message: 'Account updated', data: { account } });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ success: false, message: 'Failed to update account', error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    if (account.isDefault) {
      return res.status(403).json({ success: false, message: 'The default account cannot be deleted' });
    }
    const [expCount, tfCount] = await Promise.all([
      Expense.countDocuments({ user: req.user._id, account: account._id }),
      Transfer.countDocuments({ user: req.user._id, $or: [{ fromAccount: account._id }, { toAccount: account._id }] }),
    ]);
    if (expCount > 0 || tfCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'This account has transactions. Archive it instead of deleting.',
      });
    }
    await account.deleteOne();
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account', error: error.message });
  }
};
