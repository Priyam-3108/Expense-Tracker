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
