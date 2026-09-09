import { Budget } from '../config/models/Budget.js';
import { Expense } from '../config/models/Expense.js';

const currentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

// Get budgets for a month (defaults to current month) with computed spend
export const getBudgets = async (req, res) => {
    try {
        const month = req.query.month || currentMonth();
        const [year, monthNum] = month.split('-');
        const startDate = `${month}-01`;
        const lastDay = new Date(Number(year), Number(monthNum), 0).getDate();
        const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

        const [budgets, categoryTotals] = await Promise.all([
            Budget.find({ user: req.user._id, month }).populate('category', 'name color icon').sort({ createdAt: -1 }),
            Expense.getCategorySummary(req.user._id, startDate, endDate)
        ]);

        const totalSpent = categoryTotals.reduce((sum, c) => sum + c.total, 0);
        const spentByCategory = new Map(categoryTotals.map(c => [String(c._id), c.total]));

        const withStatus = budgets.map(b => {
            const spent = b.category ? (spentByCategory.get(String(b.category._id)) || 0) : totalSpent;
            const percentUsed = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
            return {
                ...b.toObject(),
                spent,
                remaining: b.amount - spent,
                percentUsed
            };
        });

        res.status(200).json({
            success: true,
            data: { budgets: withStatus, month }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Create budget
export const createBudget = async (req, res) => {
    try {
        const { category, amount, month } = req.body;

        const budget = await Budget.create({
            user: req.user._id,
            category: category || null,
            amount,
            month: month || currentMonth()
        });

        res.status(201).json({
            success: true,
            data: { budget }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'A budget already exists for this category and month' });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update budget
export const updateBudget = async (req, res) => {
    try {
        const { amount } = req.body;

        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({ success: false, message: 'Budget not found' });
        }
        if (budget.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        budget.amount = amount;
        await budget.save();

        res.status(200).json({
            success: true,
            data: { budget }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Delete budget
export const deleteBudget = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({ success: false, message: 'Budget not found' });
        }
        if (budget.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await budget.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
