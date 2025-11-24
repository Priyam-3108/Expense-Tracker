import express from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  bulkCreateExpenses,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getExpenseTrends,
  getDetailedAnalytics
} from '../controllers/expenseController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, expenseSchema, validateDateRange } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// CRUD operations
router.get('/', validateDateRange, getExpenses);
router.get('/stats', validateDateRange, getExpenseStats);
router.get('/trends', getExpenseTrends);
router.get('/analytics', validateDateRange, getDetailedAnalytics);
router.get('/:id', getExpense);
router.post('/bulk', bulkCreateExpenses);
router.post('/', validate(expenseSchema), createExpense);
router.put('/:id', validate(expenseSchema), updateExpense);
router.delete('/:id', deleteExpense);

export default router;
