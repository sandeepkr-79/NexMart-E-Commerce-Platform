import express from 'express';
import { 
  createReview, 
  getProductReviews, 
  voteHelpful, 
  sellerReplyToReview, 
  deleteReview 
} from '../controllers/reviewController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', protect, createReview);
router.put('/:id/helpful', protect, voteHelpful);
router.post('/:id/reply', protect, authorizeRoles('seller', 'admin'), sellerReplyToReview);
router.delete('/:id', protect, authorizeRoles('admin'), deleteReview);

export default router;
