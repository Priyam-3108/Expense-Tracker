import { z } from 'zod';

// Validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required')
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(30, 'Category name cannot exceed 30 characters'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
  icon: z.string().optional()
});

export const expenseSchema = z.object({
  description: z.string().max(100, 'Description cannot exceed 100 characters').optional(),
  amount: z.number().positive('Amount must be positive').max(999999.99, 'Amount cannot exceed 999,999.99'),
  date: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['expense', 'income']).default('expense'),
  tags: z.array(z.string().max(20)).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  isRecurring: z.boolean().optional(),
  recurringPeriod: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  recurringEndDate: z.string().optional()
});

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
      
      next(error);
    }
  };
};

// Query validation for date ranges
export const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }
  }
  
  next();
};
