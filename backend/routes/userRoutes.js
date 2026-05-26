import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  addAddress, 
  deleteAddress, 
  setDefaultAddress 
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.post('/address', protect, addAddress);
router.delete('/address/:id', protect, deleteAddress);
router.put('/address/:id/default', protect, setDefaultAddress);

export default router;
