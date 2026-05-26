import express from 'express';
import { createCoupon, validateCoupon, getCoupons, deleteCoupon } from '../controllers/couponController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorizeRoles('admin'), getCoupons)
  .post(protect, authorizeRoles('admin'), createCoupon);

router.post('/validate', protect, validateCoupon);
router.delete('/:id', protect, authorizeRoles('admin'), deleteCoupon);

export default router;
