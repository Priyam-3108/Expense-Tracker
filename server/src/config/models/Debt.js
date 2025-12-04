import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    personName: {
        type: String,
        required: [true, 'Person name is required'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0']
    },
    currentAmount: {
        type: Number,
        required: true,
        default: function () { return this.amount; }
    },
    type: {
        type: String,
        enum: ['borrowed', 'lent'],
        required: true
    },
    date: {
        type: String,
        required: [true, 'Date is required'],
        match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
    },
    dueDate: {
        type: String,
        match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'partially_paid'],
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    history: [{
        date: {
            type: Date,
            default: Date.now
        },
        amount: Number,
        type: {
            type: String,
            enum: ['payment', 'adjustment'],
            default: 'payment'
        },
        note: String
    }]
}, {
    timestamps: true
});

// Indexes
debtSchema.index({ user: 1, type: 1 });
debtSchema.index({ user: 1, status: 1 });

// Virtual for formatted amount
debtSchema.virtual('formattedAmount').get(function () {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(this.amount);
});

debtSchema.virtual('formattedCurrentAmount').get(function () {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(this.currentAmount);
});

debtSchema.set('toJSON', { virtuals: true });
debtSchema.set('toObject', { virtuals: true });

export const Debt = mongoose.model('Debt', debtSchema);
