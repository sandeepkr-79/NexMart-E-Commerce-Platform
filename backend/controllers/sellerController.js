import User from '../models/User.js';
import SellerProfile from '../models/SellerProfile.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import { uploadImage } from '../config/cloudinary.js';
import { getReviewSentiment } from '../services/ai.service.js';

// Apply for Seller Onboarding
export const applySeller = async (req, res, next) => {
  try {
    const { shopName, description, gstNumber, accountNumber, ifscCode, bankName, accountHolderName } = req.body;

    const existingProfile = await SellerProfile.findOne({ user: req.user._id });
    if (existingProfile) {
      return res.status(400).json({ message: 'Seller application already exists for this account' });
    }

    let shopLogoUrl = '';
    let shopBannerUrl = '';

    if (req.files) {
      if (req.files.shopLogo && req.files.shopLogo[0]) {
        const logoRes = await uploadImage(req.files.shopLogo[0].buffer, 'nexmart_sellers');
        shopLogoUrl = logoRes.secure_url;
      }
      if (req.files.shopBanner && req.files.shopBanner[0]) {
        const bannerRes = await uploadImage(req.files.shopBanner[0].buffer, 'nexmart_sellers');
        shopBannerUrl = bannerRes.secure_url;
      }
    }

    const sellerProfile = new SellerProfile({
      user: req.user._id,
      shopName,
      shopLogo: shopLogoUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150',
      shopBanner: shopBannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      description,
      gstNumber,
      bankDetails: {
        accountNumber,
        ifscCode,
        bankName,
        accountHolderName
      },
      isVerified: false // Admin approval gate
    });

    await sellerProfile.save();

    // Update user status
    await User.findByIdAndUpdate(req.user._id, { sellerStatus: 'pending' });

    res.status(201).json({ message: 'Seller application submitted successfully and is pending admin approval.', sellerProfile });
  } catch (error) {
    next(error);
  }
};

// Get current seller profile
export const getSellerProfile = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
};

// Update shop details
export const updateSellerProfile = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const { shopName, description } = req.body;
    profile.shopName = shopName || profile.shopName;
    profile.description = description || profile.description;

    if (req.files) {
      if (req.files.shopLogo && req.files.shopLogo[0]) {
        const logoRes = await uploadImage(req.files.shopLogo[0].buffer, 'nexmart_sellers');
        profile.shopLogo = logoRes.secure_url;
      }
      if (req.files.shopBanner && req.files.shopBanner[0]) {
        const bannerRes = await uploadImage(req.files.shopBanner[0].buffer, 'nexmart_sellers');
        profile.shopBanner = bannerRes.secure_url;
      }
    }

    await profile.save();
    res.status(200).json({ message: 'Shop profile updated successfully', profile });
  } catch (error) {
    next(error);
  }
};

// Get products belonging to current seller
export const getSellerProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user._id }).populate('category', 'name');
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
};

// Get orders containing seller products
export const getSellerOrders = async (req, res, next) => {
  try {
    // Find orders that contain products matching the seller ID
    const orders = await Order.find({ 'products.seller': req.user._id })
      .populate('user', 'name email')
      .populate('products.product', 'title images')
      .sort('-createdAt');

    // Filter order items to only present the seller's specific products
    const filteredOrders = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.products = orderObj.products.filter(p => p.seller.toString() === req.user._id.toString());
      return orderObj;
    });

    res.status(200).json({ orders: filteredOrders });
  } catch (error) {
    next(error);
  }
};

// Seller Analytics Dashboard metrics
export const getSellerAnalytics = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user._id });
    const productIds = products.map(p => p._id);
    const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const orders = await Order.find({ 'products.seller': req.user._id })
      .populate('user', 'name email')
      .populate('products.product', 'title images brand');
    let totalRevenue = 0;
    let last30Revenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;
    let totalSalesCount = 0;
    const statusCounts = {};
    const dailyMap = new Map();
    const productSales = new Map();

    orders.forEach(order => {
      statusCounts[order.orderStatus] = (statusCounts[order.orderStatus] || 0) + 1;
      const countsAsRevenue = order.paymentStatus === 'paid' || order.paymentMethod === 'cod';

      order.products.forEach(item => {
        if (item.seller.toString() === req.user._id.toString()) {
          const itemRevenue = item.price * item.qty;
          totalSalesCount += item.qty;

          if (countsAsRevenue) {
            totalRevenue += itemRevenue;

            if (order.createdAt >= thirtyDaysAgo) {
              last30Revenue += itemRevenue;
              const dateKey = order.createdAt.toISOString().slice(0, 10);
              const current = dailyMap.get(dateKey) || { date: dateKey, revenue: 0, orders: 0 };
              current.revenue += itemRevenue;
              current.orders += 1;
              dailyMap.set(dateKey, current);
            }

            if (order.createdAt >= todayStart) {
              todayRevenue += itemRevenue;
            }

            if (order.createdAt >= monthStart) {
              monthRevenue += itemRevenue;
            }
          }

          const productId = item.product?._id?.toString() || item.product?.toString();
          if (productId) {
            const currentProduct = productSales.get(productId) || {
              productId,
              title: item.product?.title || 'Unknown product',
              unitsSold: 0,
              revenue: 0,
            };
            currentProduct.unitsSold += item.qty;
            currentProduct.revenue += itemRevenue;
            productSales.set(productId, currentProduct);
          }
        }
      });
    });

    // Alert low stock
    const lowStockAlerts = products.filter(p => p.stock <= 5);

    // Fetch review ratings to get AI sentiment review summaries
    const reviews = await Review.find({ product: { $in: productIds } });
    const sentimentStats = getReviewSentiment(reviews);
    const recentOrders = orders.slice(0, 5).map(order => ({
      _id: order._id,
      customerName: order.user?.name || 'Customer',
      totalPrice: order.products
        .filter(item => item.seller.toString() === req.user._id.toString())
        .reduce((sum, item) => sum + item.price * item.qty, 0),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod || 'razorpay',
      createdAt: order.createdAt,
    }));
    const topProducts = [...productSales.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const dailyRevenue = [...dailyMap.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({ ...item, revenue: Math.round(item.revenue) }));

    res.status(200).json({
      metrics: {
        totalRevenue: Math.round(totalRevenue),
        last30Revenue: Math.round(last30Revenue),
        todayRevenue: Math.round(todayRevenue),
        monthRevenue: Math.round(monthRevenue),
        totalSalesCount,
        productsCount: products.length,
        liveProductsCount: products.filter(p => p.isApproved).length,
        pendingProductsCount: products.filter(p => !p.isApproved).length,
        ordersCount: orders.length,
        pendingOrdersCount: orders.filter(o => ['Placed', 'Packed', 'Shipped', 'Out for Delivery'].includes(o.orderStatus)).length,
        deliveredOrdersCount: orders.filter(o => o.orderStatus === 'Delivered').length,
        lowStockCount: lowStockAlerts.length,
      },
      lowStockAlerts: lowStockAlerts.map(p => ({ _id: p._id, title: p.title, stock: p.stock })),
      orderStatusBreakdown: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      recentOrders,
      topProducts,
      analytics: {
        dailyRevenue,
        products: topProducts,
      },
      todayRevenue: Math.round(todayRevenue),
      monthRevenue: Math.round(monthRevenue),
      sentiment: sentimentStats
    });
  } catch (error) {
    next(error);
  }
};

// Bulk Import Products via CSV
export const bulkImportProducts = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a CSV file.' });
    }

    const csvData = req.file.buffer.toString('utf8');
    const lines = csvData.split('\n');
    if (lines.length <= 1) {
      return res.status(400).json({ message: 'CSV file is empty or missing data headers.' });
    }

    // Expect headers: title,description,categoryName,brand,price,stock,tags
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const productsCreated = [];

    // Find default category
    const defaultCategory = await Category.findOne();
    if (!defaultCategory) {
      return res.status(500).json({ message: 'Must seed categories before CSV import' });
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple comma splitter (handles quotes roughly or standard splits)
      const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
      if (values.length < 5) continue;

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      // Find or match Category ID
      let categoryId = defaultCategory._id;
      if (row.categoryname) {
        const cat = await Category.findOne({ name: { $regex: new RegExp(`^${row.categoryname}$`, 'i') } });
        if (cat) categoryId = cat._id;
      }

      const newProduct = new Product({
        title: row.title || `CSV Product #${i}`,
        description: row.description || 'Imported via CSV',
        category: categoryId,
        brand: row.brand || 'Generic',
        price: Number(row.price) || 999,
        stock: Number(row.stock) || 10,
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
        seller: req.user._id,
        tags: row.tags ? row.tags.split(';').map(t => t.trim()) : [],
        isApproved: false // Admin approval required
      });

      await newProduct.save();
      productsCreated.push(newProduct);
    }

    res.status(201).json({
      message: `Bulk import completed. Successfully imported ${productsCreated.length} products. Pending admin review.`,
      importedCount: productsCreated.length
    });
  } catch (error) {
    next(error);
  }
};
