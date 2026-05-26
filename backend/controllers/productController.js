import Product from '../models/Product.js';
import Category from '../models/Category.js';
import APIFeatures from '../utils/apiFeatures.js';
import { indexProduct } from '../services/ai.service.js';
import { uploadImage } from '../config/cloudinary.js';

// Get all products (public)
export const getProducts = async (req, res, next) => {
  try {
    const resPerPage = Number(req.query.limit) || 12;
    
    // Check total match count for pagination reports
    const countFeatures = new APIFeatures(Product.find({ isApproved: true }), req.query)
      .search()
      .filter();
      
    const totalProducts = await countFeatures.query.countDocuments();

    // Query actual products
    const apiFeatures = new APIFeatures(Product.find({ isApproved: true }), req.query)
      .search()
      .filter()
      .sort()
      .pagination(resPerPage);

    const products = await apiFeatures.query.populate('category', 'name slug');

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      resPerPage,
      products
    });
  } catch (error) {
    next(error);
  }
};

// Get single product details (public)
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

// Create product (Seller role)
export const createProduct = async (req, res, next) => {
  try {
    const { title, description, category, brand, price, comparePrice, stock, variants, tags, aiDescription } = req.body;
    
    // Parse variants if they come as string JSON
    let parsedVariants = [];
    if (variants) {
      parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    }

    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }

    // Handle images uploaded via Multer
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadImage(file.buffer, 'nexmart_products');
        imageUrls.push(uploadResult.secure_url);
      }
    }

    const product = new Product({
      title,
      description,
      category,
      brand,
      price: Number(price),
      comparePrice: comparePrice ? Number(comparePrice) : 0,
      stock: Number(stock),
      images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
      variants: parsedVariants,
      seller: req.user._id,
      tags: parsedTags,
      aiDescription: aiDescription || '',
      isApproved: false // Admin must approve
    });

    await product.save();
    res.status(201).json({ message: 'Product created successfully and submitted for admin review.', product });
  } catch (error) {
    next(error);
  }
};

// Update product (Seller role)
export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Ensure user editing is the actual owner/seller or admin
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this product' });
    }

    const { title, description, category, brand, price, comparePrice, stock, variants, tags, aiDescription } = req.body;

    let parsedVariants = product.variants;
    if (variants) {
      parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    }

    let parsedTags = product.tags;
    if (tags) {
      parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }

    // Image updates
    let imageUrls = [...product.images];
    if (req.files && req.files.length > 0) {
      const newUrls = [];
      for (const file of req.files) {
        const uploadResult = await uploadImage(file.buffer, 'nexmart_products');
        newUrls.push(uploadResult.secure_url);
      }
      imageUrls = newUrls; // replace or combine (we replace for simplicity here)
    }

    product = await Product.findByIdAndUpdate(req.params.id, {
      title: title || product.title,
      description: description || product.description,
      category: category || product.category,
      brand: brand || product.brand,
      price: price ? Number(price) : product.price,
      comparePrice: comparePrice ? Number(comparePrice) : product.comparePrice,
      stock: stock !== undefined ? Number(stock) : product.stock,
      images: imageUrls,
      variants: parsedVariants,
      tags: parsedTags,
      aiDescription: aiDescription || product.aiDescription,
      isApproved: req.user.role === 'admin' ? product.isApproved : false // Re-verify if seller modifies
    }, { new: true });

    // If approved, trigger vector database indexing update
    if (product.isApproved) {
      await indexProduct(product);
    }

    res.status(200).json({ message: 'Product updated successfully.', product });
  } catch (error) {
    next(error);
  }
};

// Delete product
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Authorization
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Product removed successfully' });
  } catch (error) {
    next(error);
  }
};
