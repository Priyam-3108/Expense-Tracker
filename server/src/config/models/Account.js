import mongoose from 'mongoose';

const CURRENCIES = ['USD', 'EUR', 'INR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD'];

const accountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: [true, 'Account name is required'], trim: true, maxlength: [40, 'Name cannot exceed 40 characters'] },
  type: { type: String, enum: ['cash', 'bank', 'card', 'savings', 'other'], default: 'cash' },
  openingBalance: { type: Number, default: 0 },
  currency: { type: String, enum: CURRENCIES, default: 'USD' },
  isDefault: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
}, { timestamps: true });

accountSchema.index({ user: 1, archived: 1 });
accountSchema.index(
  { user: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

accountSchema.set('toJSON', { virtuals: true });
accountSchema.set('toObject', { virtuals: true });

export const Account = mongoose.model('Account', accountSchema);
