import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  toAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  amount: { type: Number, required: [true, 'Amount is required'], min: [0.01, 'Amount must be greater than 0'] },
  date: { type: String, required: [true, 'Date is required'], match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'] },
  note: { type: String, trim: true, maxlength: [300, 'Note cannot exceed 300 characters'] },
  client_uuid: { type: String, unique: true, sparse: true, index: true },
}, { timestamps: true });

transferSchema.pre('validate', function (next) {
  if (this.fromAccount && this.toAccount && String(this.fromAccount) === String(this.toAccount)) {
    this.invalidate('toAccount', 'Cannot transfer to the same account');
  }
  next();
});

transferSchema.index({ user: 1, date: -1 });
transferSchema.set('toJSON', { virtuals: true });
transferSchema.set('toObject', { virtuals: true });

export const Transfer = mongoose.model('Transfer', transferSchema);
