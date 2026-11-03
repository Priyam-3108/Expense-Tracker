import { Account, Expense, Transfer, Category } from '../config/models/index.js';
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

export const reconcileAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const { targetBalance } = req.body;
    if (typeof targetBalance !== 'number' || Number.isNaN(targetBalance)) {
      return res.status(400).json({ success: false, message: 'targetBalance must be a number' });
    }

    const balances = await computeAccountBalances(req.user._id);
    const current = balances.get(String(account._id)) ?? (account.openingBalance || 0);
    const delta = Math.round((targetBalance - current) * 100) / 100;

    if (delta === 0) {
      return res.json({ success: true, data: { adjusted: false, delta: 0 } });
    }

    let adjCat = await Category.findOne({ user: req.user._id, name: 'Adjustment' });
    if (!adjCat) {
      adjCat = await Category.create({ user: req.user._id, name: 'Adjustment', color: '#64748B', icon: '⚖️', isDefault: true });
    }

    const expense = await Expense.create({
      user: req.user._id,
      account: account._id,
      category: adjCat._id,
      amount: Math.abs(delta),
      type: delta > 0 ? 'income' : 'expense',
      date: new Date().toISOString().slice(0, 10),
      description: 'Balance adjustment',
      notes: `Reconciled to ${targetBalance}`,
      isAdjustment: true,
    });

    res.json({ success: true, data: { adjusted: true, delta, expense } });
  } catch (error) {
    console.error('Reconcile account error:', error);
    res.status(500).json({ success: false, message: 'Failed to reconcile account', error: error.message });
  }
};

export const accountStatement = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const { from, to } = req.query;
    const dateRange = from && to ? { $gte: from, $lte: to } : undefined;

    const expFilter = { user: req.user._id, account: account._id };
    if (dateRange) expFilter.date = dateRange;
    const tfFilter = { user: req.user._id, $or: [{ fromAccount: account._id }, { toAccount: account._id }] };
    if (dateRange) tfFilter.date = dateRange;

    const [expenses, transfers] = await Promise.all([
      Expense.find(expFilter).populate('category', 'name icon color').lean(),
      Transfer.find(tfFilter).populate('fromAccount toAccount', 'name').lean(),
    ]);

    const entries = [
      ...expenses.map((e) => ({
        kind: e.type === 'income' ? 'income' : 'expense',
        date: e.date,
        amount: e.amount,
        description: e.description || e.category?.name || '',
        _id: e._id,
        createdAt: e.createdAt,
      })),
      ...transfers.map((t) => {
        const outgoing = String(t.fromAccount._id) === String(account._id);
        return {
          kind: outgoing ? 'transfer-out' : 'transfer-in',
          date: t.date,
          amount: t.amount,
          counterparty: outgoing ? t.toAccount?.name : t.fromAccount?.name,
          note: t.note || '',
          _id: t._id,
          createdAt: t.createdAt,
        };
      }),
    ].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : new Date(a.createdAt) - new Date(b.createdAt)));

    res.json({ success: true, data: { entries } });
  } catch (error) {
    console.error('Account statement error:', error);
    res.status(500).json({ success: false, message: 'Failed to build statement', error: error.message });
  }
};
