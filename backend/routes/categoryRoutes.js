import express from 'express';
import { getCategories, createCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(protect, authorizeRoles('admin'), createCategory);

router.route('/:id')
  .delete(protect, authorizeRoles('admin'), deleteCategory);

export default router;
