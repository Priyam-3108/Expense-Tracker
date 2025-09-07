import express from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
} from '../controllers/categoryController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, categorySchema } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// CRUD operations
router.get('/', getCategories);
router.get('/stats', getCategoryStats);
router.get('/:id', getCategory);
router.post('/', validate(categorySchema), createCategory);
router.put('/:id', validate(categorySchema), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
