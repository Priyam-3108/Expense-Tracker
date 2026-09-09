import express from 'express';
import { authenticateToken as protect } from '../middleware/auth.js';
import {
    getBudgets,
    createBudget,
    updateBudget,
    deleteBudget
} from '../controllers/budgetController.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getBudgets)
    .post(createBudget);

router.route('/:id')
    .put(updateBudget)
    .delete(deleteBudget);

export default router;
