import express from 'express';
import { 
  handleAIChat, 
  uploadPdfManual, 
  triggerReindex, 
  generateDescription, 
  suggestPricing, 
  suggestTags, 
  getAICostDashboard,
  getMyChatHistory
} from '../controllers/aiController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/chat', protect, handleAIChat);
router.get('/chat-history', protect, getMyChatHistory);
router.post('/upload-pdf', protect, authorizeRoles('admin'), uploadSingle('pdf'), uploadPdfManual);
router.post('/reindex', protect, authorizeRoles('admin'), triggerReindex);

// Seller AI Tools
router.post('/description', protect, authorizeRoles('seller', 'admin'), generateDescription);
router.get('/suggest-price', protect, authorizeRoles('seller', 'admin'), suggestPricing);
router.post('/generate-tags', protect, authorizeRoles('seller', 'admin'), suggestTags);

// Admin Cost Metrics
router.get('/cost-dashboard', protect, authorizeRoles('admin'), getAICostDashboard);

export default router;
