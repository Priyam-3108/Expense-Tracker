import express from 'express';
import { authenticateToken as protect } from '../middleware/auth.js';
import {
    getDebts,
    createDebt,
    updateDebt,
    deleteDebt,
    addRepayment
} from '../controllers/debtController.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getDebts)
    .post(createDebt);

router.route('/:id')
    .put(updateDebt)
    .delete(deleteDebt);

router.route('/:id/repay')
    .post(addRepayment);

export default router;
