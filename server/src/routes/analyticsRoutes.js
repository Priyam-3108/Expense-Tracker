import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { sharedAuth } from '../middleware/sharedAuth.js';
import { getShareToken, revokeShareToken, getSharedProfile, getSharedCategories } from '../controllers/analyticsController.js';
import { getDetailedAnalytics, getExpenseTrends, getExpenses, getExpenseStats } from '../controllers/expenseController.js';

const router = express.Router();

// Management routes (Protected)
router.post('/share', authenticateToken, getShareToken);
router.delete('/share', authenticateToken, revokeShareToken);

// Shared View Routes (Public with Token)
// These routes reuse the expense controller logic but authenticate via the share token
router.get('/shared/:token/profile', sharedAuth, getSharedProfile);
router.get('/shared/:token/categories', sharedAuth, getSharedCategories);
router.get('/shared/:token/detailed', sharedAuth, getDetailedAnalytics);
router.get('/shared/:token/trends', sharedAuth, getExpenseTrends);
router.get('/shared/:token/stats', sharedAuth, getExpenseStats);
router.get('/shared/:token/expenses', sharedAuth, getExpenses);

export default router;
