import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [30, 'Category name cannot exceed 30 characters']
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
  },
  icon: {
    type: String,
    default: '💰' // Default emoji icon
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure unique category names per user
categorySchema.index({ name: 1, user: 1 }, { unique: true });

// Virtual for expense count (will be populated when needed)
categorySchema.virtual('expenseCount', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Ensure virtuals are included in JSON output
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

export const Category = mongoose.model('Category', categorySchema);
