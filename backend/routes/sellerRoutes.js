import express from 'express';
import { 
  applySeller, 
  getSellerProfile, 
  updateSellerProfile, 
  getSellerProducts, 
  getSellerOrders, 
  getSellerAnalytics, 
  bulkImportProducts 
} from '../controllers/sellerController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { uploadSingle, uploadFields } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/apply', protect, uploadFields([
  { name: 'shopLogo', maxCount: 1 },
  { name: 'shopBanner', maxCount: 1 }
]), applySeller);

router.route('/profile')
  .get(protect, getSellerProfile)
  .put(protect, uploadFields([
    { name: 'shopLogo', maxCount: 1 },
    { name: 'shopBanner', maxCount: 1 }
  ]), updateSellerProfile);

router.get('/products', protect, authorizeRoles('seller', 'admin'), getSellerProducts);
router.get('/orders', protect, authorizeRoles('seller', 'admin'), getSellerOrders);
router.get('/analytics', protect, authorizeRoles('seller', 'admin'), getSellerAnalytics);
router.post('/import-csv', protect, authorizeRoles('seller', 'admin'), uploadSingle('csv'), bulkImportProducts);

export default router;
