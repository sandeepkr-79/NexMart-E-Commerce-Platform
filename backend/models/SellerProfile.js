import mongoose from 'mongoose';

const sellerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  shopName: { type: String, required: true },
  shopLogo: { type: String, default: '' },
  shopBanner: { type: String, default: '' },
  description: { type: String, default: '' },
  gstNumber: { type: String, required: true },
  bankDetails: {
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    bankName: { type: String, required: true },
    accountHolderName: { type: String, required: true }
  },
  isVerified: { type: Boolean, default: false },
  totalRevenue: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema);
export default SellerProfile;
