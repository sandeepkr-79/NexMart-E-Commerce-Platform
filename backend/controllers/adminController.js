import User from '../models/User.js';
import SellerProfile from '../models/SellerProfile.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import { sendSellerStatusEmail, sendEmail } from '../services/email.service.js';
import { indexProduct } from '../services/ai.service.js';
import { sendNotificationToUser, sendNotificationToSeller } from '../services/socket.service.js';
import { uploadImage } from '../config/cloudinary.js';

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

const uploadProductImages = async (files = []) => {
  const imageUrls = [];
  for (const file of files) {
    const uploadResult = await uploadImage(file.buffer, 'nexmart_products');
    imageUrls.push(uploadResult.secure_url);
  }
  return imageUrls;
};

// --- User Management ---

// View, search and filter all users
export const getAllUsers = async (req, res, next) => {
  try {
    const { keyword, role } = req.query;
    const query = {};

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    // Exclude users whose emails have been soft deleted
    query.email = { $not: /^deleted_user_/ };

    const users = await User.find(query).select('-password').sort('-createdAt');
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

// Create user
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, isVerified, sellerStatus } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const userRole = role || 'customer';
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      isVerified: Boolean(isVerified),
      sellerStatus: sellerStatus || (userRole === 'seller' ? 'approved' : 'none'),
    });

    const safeUser = await User.findById(user._id).select('-password');
    res.status(201).json({ message: 'User created successfully', user: safeUser });
  } catch (error) {
    next(error);
  }
};

// Update user profile fields
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, password, role, isVerified, sellerStatus } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (isVerified !== undefined) user.isVerified = Boolean(isVerified);
    if (sellerStatus !== undefined) user.sellerStatus = sellerStatus;
    if (password) user.password = password;

    if (role === 'seller' && user.sellerStatus === 'none') {
      user.sellerStatus = 'approved';
    }

    await user.save();
    const safeUser = await User.findById(user._id).select('-password');
    res.status(200).json({ message: 'User updated successfully', user: safeUser });
  } catch (error) {
    next(error);
  }
};

// Promote / Demote Roles
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    if (role === 'seller' && user.sellerStatus === 'none') {
      user.sellerStatus = 'approved';
    }
    await user.save();

    sendNotificationToUser(user._id, 'SYSTEM', `Your account role has been updated to: ${role}`, '/dashboard');

    res.status(200).json({ message: `Role updated successfully to ${role}`, user });
  } catch (error) {
    next(error);
  }
};

// Ban / Unban User with Reason
export const banUser = async (req, res, next) => {
  try {
    const { isBan, reason } = req.body; // isBan: boolean
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.sellerStatus = isBan ? 'suspended' : (user.role === 'seller' ? 'approved' : 'none');
    await user.save();

    // Notify user via Email
    const subject = isBan ? 'NexMart - Account Suspended' : 'NexMart - Account Suspension Lifted';
    const text = isBan 
      ? `Your account has been suspended by the administrator. Reason: ${reason || 'Violation of terms.'}` 
      : 'Your account suspension has been lifted. You can now login again.';
      
    await sendEmail({ to: user.email, subject, html: `<h3>Account Notification</h3><p>${text}</p>` });

    res.status(200).json({ message: `User status changed. Banned: ${isBan}`, user });
  } catch (error) {
    next(error);
  }
};

// Soft Delete User (data retention)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete: scrub personal identifiable info, retain order history link
    user.name = 'Deleted Customer';
    user.email = `deleted_user_${user._id}@nexmart.com`;
    user.password = 'deleted_password_scrubbed_123';
    user.addresses = [];
    user.refreshToken = '';
    user.sellerStatus = 'none';
    user.role = 'customer';
    await user.save();

    res.status(200).json({ message: 'User soft-deleted successfully. PII scrubbed, transaction records retained.' });
  } catch (error) {
    next(error);
  }
};

// --- Seller Management ---

// View seller applications
export const getSellerApplications = async (req, res, next) => {
  try {
    const sellers = await SellerProfile.find().populate('user', 'name email sellerStatus role isVerified');
    res.status(200).json({ sellers });
  } catch (error) {
    next(error);
  }
};

// Create seller and linked user
export const createSeller = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      shopName,
      description,
      gstNumber,
      accountNumber,
      ifscCode,
      bankName,
      accountHolderName,
      isVerified,
    } = req.body;

    if (!name || !email || !password || !shopName || !gstNumber) {
      return res.status(400).json({ message: 'Name, email, password, shop name, and GST number are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const approved = Boolean(isVerified);
    const user = await User.create({
      name,
      email,
      password,
      role: 'seller',
      isVerified: true,
      sellerStatus: approved ? 'approved' : 'pending',
    });

    const seller = await SellerProfile.create({
      user: user._id,
      shopName,
      description: description || '',
      gstNumber,
      bankDetails: {
        accountNumber: accountNumber || '0000000000',
        ifscCode: ifscCode || 'ADMIN000000',
        bankName: bankName || 'Admin Seed Bank',
        accountHolderName: accountHolderName || shopName,
      },
      isVerified: approved,
    });

    res.status(201).json({ message: 'Seller created successfully', seller });
  } catch (error) {
    next(error);
  }
};

// Update seller profile and linked user
export const updateSeller = async (req, res, next) => {
  try {
    const {
      name,
      email,
      shopName,
      description,
      gstNumber,
      accountNumber,
      ifscCode,
      bankName,
      accountHolderName,
      isVerified,
      sellerStatus,
    } = req.body;

    const profile = await SellerProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const user = await User.findById(profile.user);
    if (!user) {
      return res.status(404).json({ message: 'Owner user not found' });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (sellerStatus !== undefined) user.sellerStatus = sellerStatus;
    if (isVerified !== undefined) {
      profile.isVerified = Boolean(isVerified);
      user.sellerStatus = Boolean(isVerified) ? 'approved' : 'pending';
    }
    user.role = 'seller';

    if (shopName !== undefined) profile.shopName = shopName;
    if (description !== undefined) profile.description = description;
    if (gstNumber !== undefined) profile.gstNumber = gstNumber;
    if (accountNumber !== undefined) profile.bankDetails.accountNumber = accountNumber;
    if (ifscCode !== undefined) profile.bankDetails.ifscCode = ifscCode;
    if (bankName !== undefined) profile.bankDetails.bankName = bankName;
    if (accountHolderName !== undefined) profile.bankDetails.accountHolderName = accountHolderName;

    await user.save();
    await profile.save();

    const seller = await SellerProfile.findById(profile._id).populate('user', 'name email sellerStatus role isVerified');
    res.status(200).json({ message: 'Seller updated successfully', seller });
  } catch (error) {
    next(error);
  }
};

// Delete seller profile and demote linked account
export const deleteSeller = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    await Product.updateMany({ seller: profile.user }, { isApproved: false });
    await User.findByIdAndUpdate(profile.user, {
      role: 'customer',
      sellerStatus: 'none',
    });
    await SellerProfile.findByIdAndDelete(profile._id);

    res.status(200).json({ message: 'Seller profile deleted and account demoted to customer' });
  } catch (error) {
    next(error);
  }
};

// Approve / Reject Seller Application
export const approveSellerApplication = async (req, res, next) => {
  try {
    const { action, feedback } = req.body; // action: 'approve' or 'reject'
    const profile = await SellerProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const user = await User.findById(profile.user);
    if (!user) {
      return res.status(404).json({ message: 'Owner user not found' });
    }

    if (action === 'approve') {
      profile.isVerified = true;
      user.sellerStatus = 'approved';
      user.role = 'seller';
      await profile.save();
      await user.save();

      await sendSellerStatusEmail(user.email, profile.shopName, 'APPROVED', feedback);
      sendNotificationToUser(user._id, 'SELLER_APPROVED', `Congratulations! Your seller application for ${profile.shopName} has been approved.`, '/seller/dashboard');
    } else {
      user.sellerStatus = 'none';
      await user.save();
      await SellerProfile.findByIdAndDelete(profile._id); // Delete profile to allow re-application

      await sendSellerStatusEmail(user.email, profile.shopName, 'REJECTED', feedback);
      sendNotificationToUser(user._id, 'SELLER_REJECTED', `Your seller application has been rejected. Reason: ${feedback}`, '/dashboard');
    }

    res.status(200).json({ message: `Seller application processed. Status: ${action}` });
  } catch (error) {
    next(error);
  }
};

// Send mass notifications to all sellers
export const sendMassNotification = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const sellers = await User.find({ role: 'seller', sellerStatus: 'approved' });
    for (const seller of sellers) {
      sendNotificationToSeller(seller._id, 'SYSTEM', message, '/seller/dashboard');
      // Send email in background
      sendEmail({
        to: seller.email,
        subject: 'NexMart - Platform Administrative Notification',
        html: `<h3>Notification for Sellers</h3><p>${message}</p>`
      });
    }

    res.status(200).json({ message: `Mass notice dispatched to ${sellers.length} active sellers.` });
  } catch (error) {
    next(error);
  }
};

// --- Product Management ---

// View all products for admin (approved & pending)
export const getAllProductsAdmin = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('seller', 'name email')
      .sort('-createdAt');
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
};

// Create product as admin
export const createProductAdmin = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      brand,
      price,
      comparePrice,
      stock,
      tags,
      seller,
      isApproved,
      aiDescription,
    } = req.body;

    if (!title || !description || !category || !brand || !seller) {
      return res.status(400).json({ message: 'Title, description, category, brand, and seller are required' });
    }

    const imageUrls = await uploadProductImages(req.files);

    const product = await Product.create({
      title,
      description,
      category,
      brand,
      price: Number(price) || 0,
      comparePrice: Number(comparePrice) || 0,
      stock: Number(stock) || 0,
      images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
      seller,
      tags: parseList(tags),
      aiDescription: aiDescription || '',
      isApproved: parseBoolean(isApproved),
    });

    if (product.isApproved) {
      await indexProduct(product);
    }

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    next(error);
  }
};

// Update product as admin
export const updateProductAdmin = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const allowedFields = ['title', 'description', 'category', 'brand', 'seller', 'aiDescription'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    if (req.body.price !== undefined) product.price = Number(req.body.price);
    if (req.body.comparePrice !== undefined) product.comparePrice = Number(req.body.comparePrice);
    if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
    if (req.files && req.files.length > 0) {
      product.images = await uploadProductImages(req.files);
    }
    if (req.body.tags !== undefined) product.tags = parseList(req.body.tags);
    if (req.body.isApproved !== undefined) product.isApproved = parseBoolean(req.body.isApproved);

    await product.save();
    if (product.isApproved) {
      await indexProduct(product);
    }

    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    next(error);
  }
};

// Delete product as admin
export const deleteProductAdmin = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Promise.all([
      Review.deleteMany({ product: product._id }),
      Product.findByIdAndDelete(product._id),
    ]);

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Approve Product listing
export const approveProduct = async (req, res, next) => {
  try {
    const { isApproved } = req.body; // true or false
    const product = await Product.findByIdAndUpdate(req.params.id, { isApproved }, { new: true });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (isApproved) {
      // Ingest into vector store
      await indexProduct(product);
      sendNotificationToSeller(product.seller, 'SYSTEM', `Your product "${product.title}" has been approved and is now live.`, '/seller/products');
    }

    res.status(200).json({ message: `Product approval status set to: ${isApproved}`, product });
  } catch (error) {
    next(error);
  }
};

// --- Platform Dashboard Analytics ---

export const getPlatformStats = async (req, res, next) => {
  try {
    const [
      revenueStats,
      usersCount,
      sellersCount,
      verifiedSellersCount,
      productsCount,
      approvedProductsCount,
      pendingProductsCount,
      ordersCount,
      pendingOrdersCount,
      revenueTimeline,
      orderStatusBreakdown,
      paymentMethodBreakdown,
      userRoleBreakdown,
      topProducts,
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            $or: [{ paymentStatus: 'paid' }, { paymentMethod: 'cod' }],
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            averageOrderValue: { $avg: '$totalPrice' },
          },
        },
      ]),
      User.countDocuments({ email: { $not: /^deleted_user_/ } }),
      User.countDocuments({ role: 'seller' }),
      SellerProfile.countDocuments({ isVerified: true }),
      Product.countDocuments(),
      Product.countDocuments({ isApproved: true }),
      Product.countDocuments({ isApproved: false }),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: { $in: ['Placed', 'Packed', 'Shipped', 'Out for Delivery'] } }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
            $or: [{ paymentStatus: 'paid' }, { paymentMethod: 'cod' }],
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            revenue: { $round: ['$revenue', 0] },
            orders: 1,
          },
        },
      ]),
      Order.aggregate([
        { $group: { _id: '$orderStatus', value: { $sum: 1 } } },
        { $project: { _id: 0, name: '$_id', value: 1 } },
        { $sort: { value: -1 } },
      ]),
      Order.aggregate([
        { $group: { _id: { $ifNull: ['$paymentMethod', 'razorpay'] }, value: { $sum: 1 } } },
        { $project: { _id: 0, name: '$_id', value: 1 } },
        { $sort: { value: -1 } },
      ]),
      User.aggregate([
        { $match: { email: { $not: /^deleted_user_/ } } },
        { $group: { _id: '$role', value: { $sum: 1 } } },
        { $project: { _id: 0, name: '$_id', value: 1 } },
        { $sort: { value: -1 } },
      ]),
      Order.aggregate([
        { $unwind: '$products' },
        {
          $group: {
            _id: '$products.product',
            unitsSold: { $sum: '$products.qty' },
            revenue: { $sum: { $multiply: ['$products.qty', '$products.price'] } },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            title: '$product.title',
            brand: '$product.brand',
            unitsSold: 1,
            revenue: { $round: ['$revenue', 0] },
          },
        },
      ]),
    ]);

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const averageOrderValue = revenueStats[0]?.averageOrderValue || 0;
    const verifiedSellerRate =
      sellersCount > 0 ? Math.round((verifiedSellersCount / sellersCount) * 100) : 0;

    res.status(200).json({
      metrics: {
        totalRevenue: Math.round(totalRevenue),
        averageOrderValue: Math.round(averageOrderValue),
        ordersCount,
        pendingOrdersCount,
        usersCount,
        sellersCount,
        verifiedSellersCount,
        verifiedSellerRate,
        productsCount,
        approvedProductsCount,
        pendingProductsCount,
      },
      revenueTimeline,
      orderStatusBreakdown,
      paymentMethodBreakdown,
      userRoleBreakdown,
      topProducts,
    });
  } catch (error) {
    next(error);
  }
};
