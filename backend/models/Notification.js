import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    enum: ['ORDER_STATUS', 'NEW_ORDER', 'SELLER_REGISTRATION', 'SELLER_APPROVED', 'SELLER_REJECTED', 'LOW_STOCK', 'SYSTEM'], 
    required: true 
  },
  message: { type: String, required: true },
  link: { type: String, default: '' }, // Frontend URL context
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
