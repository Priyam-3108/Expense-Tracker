import mongoose from 'mongoose';
import { Expense } from '../config/models/Expense.js';
import { Account } from '../config/models/Account.js';

export const syncExpenses = async (req, res) => {
    try {
        const { expenses } = req.body;

        if (!expenses || !Array.isArray(expenses)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format. Expected an array of expenses.'
            });
        }

        const defaultAccount = await Account.findOne({ user: req.user._id, isDefault: true });
        const ownedAccountIds = new Set(
            (await Account.find({ user: req.user._id }).select('_id').lean()).map((a) => String(a._id))
        );

        const results = await Promise.all(expenses.map(async (expenseData) => {
            try {
                const { client_uuid, ...data } = expenseData;

                // valid client_uuid is required for sync
                if (!client_uuid) {
                    return {
                        client_uuid: null,
                        status: 'FAILED',
                        error: 'Missing client_uuid'
                    };
                }

                // Edits carry the existing server _id — update in place rather
                // than matching/creating by client_uuid (a fresh uuid is minted
                // for every local save, so client_uuid never matches on edit).
                const editId = data._id || data.id;
                if (editId) {
                    const { _id, id, ...updateData } = data;

                    if (updateData.account) {
                        if (!mongoose.isValidObjectId(updateData.account) || !ownedAccountIds.has(String(updateData.account))) {
                            return { client_uuid, status: 'FAILED', error: 'Invalid account' };
                        }
                    }

                    const updated = await Expense.findOneAndUpdate(
                        { _id: editId, user: req.user._id },
                        { ...updateData, client_uuid },
                        { new: true, runValidators: true }
                    );

                    if (!updated) {
                        return {
                            client_uuid,
                            status: 'FAILED',
                            error: 'Expense not found for update'
                        };
                    }

                    return {
                        client_uuid,
                        server_id: updated._id,
                        status: 'SYNCED',
                        action: 'UPDATED'
                    };
                }

                // Check if exists
                let expense = await Expense.findOne({ client_uuid, user: req.user._id });

                if (expense) {
                    return {
                        client_uuid,
                        server_id: expense._id,
                        status: 'SYNCED',
                        action: 'EXISTING'
                    };
                }

                // Create new
                let resolvedAccount = defaultAccount ? defaultAccount._id : null;
                if (data.account) {
                    if (!mongoose.isValidObjectId(data.account) || !ownedAccountIds.has(String(data.account))) {
                        return { client_uuid, status: 'FAILED', error: 'Invalid account' };
                    }
                    resolvedAccount = data.account;
                }

                expense = await Expense.create({
                    ...data,
                    account: resolvedAccount,
                    client_uuid,
                    user: req.user._id
                });

                return {
                    client_uuid,
                    server_id: expense._id,
                    status: 'SYNCED',
                    action: 'CREATED'
                };

            } catch (err) {
                console.error('Sync error for expense:', expenseData, err);
                return {
                    client_uuid: expenseData.client_uuid,
                    status: 'FAILED',
                    error: err.message
                };
            }
        }));

        res.status(200).json({
            success: true,
            results
        });

    } catch (error) {
        console.error('Global sync error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during sync'
        });
    }
};
