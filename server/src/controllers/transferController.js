import mongoose from 'mongoose';
import { Account, Transfer } from '../config/models/index.js';

async function validatePair(userId, fromId, toId) {
  if (!mongoose.isValidObjectId(fromId) || !mongoose.isValidObjectId(toId)) return { error: 'Invalid account' };
  if (String(fromId) === String(toId)) return { error: 'Cannot transfer to the same account' };
  const [from, to] = await Promise.all([
    Account.findOne({ _id: fromId, user: userId }),
    Account.findOne({ _id: toId, user: userId }),
  ]);
  if (!from || !to) return { error: 'Invalid account' };
  if (from.currency !== to.currency) return { error: 'Transfer accounts must use the same currency' };
  return { from, to };
}

export const listTransfers = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    const { from, to } = req.query;
    if (from && to) filter.date = { $gte: from, $lte: to };
    const transfers = await Transfer.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .populate('fromAccount toAccount', 'name type currency')
      .lean();
    res.json({ success: true, data: { transfers } });
  } catch (error) {
    console.error('List transfers error:', error);
    res.status(500).json({ success: false, message: 'Failed to list transfers', error: error.message });
  }
};

export const createTransfer = async (req, res) => {
  try {
    const { fromAccount, toAccount, amount, date, note } = req.body;
    const v = await validatePair(req.user._id, fromAccount, toAccount);
    if (v.error) return res.status(400).json({ success: false, message: v.error });

    const transfer = await Transfer.create({
      user: req.user._id, fromAccount, toAccount, amount: parseFloat(amount), date, note: note ? note.trim() : undefined,
    });
    await transfer.populate('fromAccount toAccount', 'name type currency');
    res.status(201).json({ success: true, message: 'Transfer created', data: { transfer } });
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ success: false, message: 'Failed to create transfer', error: error.message });
  }
};

export const updateTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findOne({ _id: req.params.id, user: req.user._id });
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    const { date, note } = req.body;
    if (date !== undefined) transfer.date = date;
    if (note !== undefined) transfer.note = note ? note.trim() : undefined;
    await transfer.save();
    res.json({ success: true, message: 'Transfer updated', data: { transfer } });
  } catch (error) {
    console.error('Update transfer error:', error);
    res.status(500).json({ success: false, message: 'Failed to update transfer', error: error.message });
  }
};

export const deleteTransfer = async (req, res) => {
  try {
    const t = await Transfer.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!t) return res.status(404).json({ success: false, message: 'Transfer not found' });
    res.json({ success: true, message: 'Transfer deleted' });
  } catch (error) {
    console.error('Delete transfer error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete transfer', error: error.message });
  }
};

export const syncTransfers = async (req, res) => {
  try {
    const { transfers } = req.body;
    if (!Array.isArray(transfers)) {
      return res.status(400).json({ success: false, message: 'Expected an array of transfers.' });
    }
    const results = await Promise.all(transfers.map(async (data) => {
      try {
        const { client_uuid } = data;
        if (!client_uuid) return { client_uuid: null, status: 'FAILED', error: 'Missing client_uuid' };
        const existing = await Transfer.findOne({ client_uuid, user: req.user._id });
        if (existing) return { client_uuid, server_id: existing._id, status: 'SYNCED', action: 'EXISTING' };

        const v = await validatePair(req.user._id, data.fromAccount, data.toAccount);
        if (v.error) return { client_uuid, status: 'FAILED', error: v.error };

        const created = await Transfer.create({
          user: req.user._id,
          fromAccount: data.fromAccount,
          toAccount: data.toAccount,
          amount: parseFloat(data.amount),
          date: data.date,
          note: data.note,
          client_uuid,
        });
        return { client_uuid, server_id: created._id, status: 'SYNCED', action: 'CREATED' };
      } catch (err) {
        return { client_uuid: data.client_uuid, status: 'FAILED', error: err.message };
      }
    }));
    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Sync transfers error:', error);
    res.status(500).json({ success: false, message: 'Server error during transfer sync' });
  }
};
