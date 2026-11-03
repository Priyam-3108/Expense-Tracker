import express from 'express';
import { listAccounts, createAccount, updateAccount, deleteAccount, reconcileAccount, accountStatement } from '../controllers/accountController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, accountSchema } from '../middleware/validation.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', listAccounts);
router.post('/', validate(accountSchema), createAccount);
router.put('/:id', validate(accountSchema.partial()), updateAccount);
router.delete('/:id', deleteAccount);
router.post('/:id/reconcile', reconcileAccount);
router.get('/:id/statement', accountStatement);

export default router;
