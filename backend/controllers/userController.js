import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Get current user profile
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      if (req.body.password) {
        user.password = req.body.password; // Mongoose post-save hashes this
      }
      if (req.body.avatar) {
        user.avatar = req.body.avatar;
      }
      
      const updatedUser = await user.save();
      res.status(200).json({
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          sellerStatus: updatedUser.sellerStatus,
          avatar: updatedUser.avatar
        }
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// Add shipping address
export const addAddress = async (req, res, next) => {
  try {
    const { street, city, state, zipCode, country, isDefault } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: isDefault || user.addresses.length === 0
    });

    await user.save();
    res.status(200).json({ message: 'Address added successfully', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// Delete address
export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.id);
    
    // Ensure at least one address is default if any exist
    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.status(200).json({ message: 'Address removed successfully', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// Set default address
export const setDefaultAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === req.params.id;
    });

    await user.save();
    res.status(200).json({ message: 'Default address updated', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};
