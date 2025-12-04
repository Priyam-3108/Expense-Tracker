import { Debt } from '../config/models/Debt.js';

// Get all debts
export const getDebts = async (req, res) => {
    try {
        const debts = await Debt.find({ user: req.user._id }).sort({ date: -1 });
        res.status(200).json({
            success: true,
            data: {
                debts,
                count: debts.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Create new debt
export const createDebt = async (req, res) => {
    try {
        const { personName, amount, type, date, dueDate, notes } = req.body;

        const debt = await Debt.create({
            user: req.user._id,
            personName,
            amount,
            currentAmount: amount,
            type,
            date,
            dueDate,
            notes,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            data: { debt }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update debt
export const updateDebt = async (req, res) => {
    try {
        const { personName, date, dueDate, notes } = req.body;

        let debt = await Debt.findById(req.params.id);

        if (!debt) {
            return res.status(404).json({
                success: false,
                message: 'Debt record not found'
            });
        }

        // Make sure user owns the debt record
        if (debt.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        debt = await Debt.findByIdAndUpdate(
            req.params.id,
            { personName, date, dueDate, notes },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: { debt }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Delete debt
export const deleteDebt = async (req, res) => {
    try {
        const debt = await Debt.findById(req.params.id);

        if (!debt) {
            return res.status(404).json({
                success: false,
                message: 'Debt record not found'
            });
        }

        // Make sure user owns the debt record
        if (debt.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        await debt.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Add repayment
export const addRepayment = async (req, res) => {
    try {
        const { amount, date, note } = req.body;
        const paymentAmount = Number(amount);

        if (!paymentAmount || paymentAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid payment amount'
            });
        }

        const debt = await Debt.findById(req.params.id);

        if (!debt) {
            return res.status(404).json({
                success: false,
                message: 'Debt record not found'
            });
        }

        if (debt.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (paymentAmount > debt.currentAmount) {
            return res.status(400).json({
                success: false,
                message: 'Payment amount cannot exceed remaining debt amount'
            });
        }

        // Update current amount
        debt.currentAmount -= paymentAmount;

        // Update status
        if (debt.currentAmount === 0) {
            debt.status = 'paid';
        } else {
            debt.status = 'partially_paid';
        }

        // Add to history
        debt.history.push({
            amount: paymentAmount,
            date: date || new Date(),
            type: 'payment',
            note
        });

        await debt.save();

        res.status(200).json({
            success: true,
            data: { debt }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
