import Coupon from '../models/Coupon.js';

// Create a Coupon (Admin only)
export const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxUses, expiresAt } = req.body;

    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return res.status(400).json({ message: 'Coupon with this code already exists' });
    }

    const coupon = new Coupon({
      code,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxUses: Number(maxUses) || 100,
      expiresAt: new Date(expiresAt)
    });

    await coupon.save();
    res.status(201).json({ message: 'Coupon created successfully', coupon });
  } catch (error) {
    next(error);
  }
};

// Validate Coupon
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon code not found or inactive' });
    }

    if (new Date() > coupon.expiresAt) {
      return res.status(400).json({ message: 'Coupon code has expired' });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ message: 'Coupon code usage limits reached' });
    }

    if (Number(subtotal) < coupon.minOrderValue) {
      return res.status(400).json({ message: `Minimum order value for this coupon is ₹${coupon.minOrderValue}` });
    }

    // Return calculations
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (Number(subtotal) * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    res.status(200).json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.min(discountAmount, Number(subtotal))
    });
  } catch (error) {
    next(error);
  }
};

// Get all coupons (Admin)
export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.status(200).json({ coupons });
  } catch (error) {
    next(error);
  }
};

// Delete Coupon (Admin)
export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
};
