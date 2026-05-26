import express from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { uploadArray } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, authorizeRoles('seller', 'admin'), uploadArray('images', 5), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, authorizeRoles('seller', 'admin'), uploadArray('images', 5), updateProduct)
  .delete(protect, authorizeRoles('seller', 'admin'), deleteProduct);

export default router;
