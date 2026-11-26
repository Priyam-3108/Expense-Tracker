import { Expense } from '../config/models/Expense.js';

export const syncExpenses = async (req, res) => {
    try {
        const { expenses } = req.body;

        if (!expenses || !Array.isArray(expenses)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format. Expected an array of expenses.'
            });
        }

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
                expense = await Expense.create({
                    ...data,
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
