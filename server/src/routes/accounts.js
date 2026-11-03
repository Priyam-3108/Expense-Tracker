import express from 'express';
import { listAccounts, createAccount, updateAccount, deleteAccount } from '../controllers/accountController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, accountSchema } from '../middleware/validation.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', listAccounts);
router.post('/', validate(accountSchema), createAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;
