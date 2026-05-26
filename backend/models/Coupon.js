import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, index: true },
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderValue: { type: Number, default: 0 },
  maxUses: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
