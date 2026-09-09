import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null // null = overall/total monthly budget
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0']
    },
    month: {
        type: String,
        required: [true, 'Month is required'],
        match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format']
    }
}, {
    timestamps: true
});

// One budget per user/category/month (category: null covers the overall budget)
budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model('Budget', budgetSchema);
