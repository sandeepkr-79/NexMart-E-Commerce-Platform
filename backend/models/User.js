import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' },
  isVerified: { type: Boolean, default: false },
  verificationOtp: { type: String },
  verificationOtpExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  sellerStatus: { type: String, enum: ['none', 'pending', 'approved', 'suspended'], default: 'none' },
  avatar: { type: String, default: '' },
  googleId: { type: String, default: '' },
  addresses: [addressSchema],
  refreshToken: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
