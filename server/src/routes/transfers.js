import express from 'express';
import { listTransfers, createTransfer, updateTransfer, deleteTransfer, syncTransfers } from '../controllers/transferController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, transferSchema } from '../middleware/validation.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', listTransfers);
router.post('/sync', syncTransfers);
router.post('/', validate(transferSchema), createTransfer);
router.put('/:id', updateTransfer);
router.delete('/:id', deleteTransfer);

export default router;
