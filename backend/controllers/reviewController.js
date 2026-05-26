import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// Create a product review (Customers who purchased and received the product only)
export const createReview = async (req, res, next) => {
  try {
    const { rating, title, body, images } = req.body;
    const productId = req.params.productId;

    // Check if customer already reviewed the product
    const reviewed = await Review.findOne({ user: req.user._id, product: productId });
    if (reviewed) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Verify customer has a completed/delivered order containing this product
    const purchased = await Order.findOne({
      user: req.user._id,
      paymentStatus: 'paid',
      orderStatus: 'Delivered',
      'products.product': productId
    });

    if (!purchased) {
      return res.status(403).json({ message: 'Only verified purchasers who have received the item can write reviews.' });
    }

    const review = new Review({
      user: req.user._id,
      product: productId,
      rating: Number(rating),
      title,
      body,
      images: images || []
    });

    await review.save(); // triggers static calculateAverageRating in Review model
    res.status(201).json({ message: 'Review posted successfully', review });
  } catch (error) {
    next(error);
  }
};

// Get reviews of a product
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar')
      .sort('-createdAt');

    res.status(200).json({ reviews });
  } catch (error) {
    next(error);
  }
};

// Toggle Helpful vote
export const voteHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const hasVoted = review.helpful.includes(req.user._id);
    if (hasVoted) {
      review.helpful = review.helpful.filter(id => id.toString() !== req.user._id.toString());
    } else {
      review.helpful.push(req.user._id);
    }

    await review.save();
    res.status(200).json({ message: 'Helpful vote toggled', review });
  } catch (error) {
    next(error);
  }
};

// Seller reply to a review
export const sellerReplyToReview = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const review = await Review.findById(req.params.id).populate('product');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Verify reviewer belongs to seller's product
    if (review.product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to reply to reviews for other shop items' });
    }

    review.sellerReply = {
      comment,
      repliedAt: new Date()
    };

    await review.save();
    res.status(200).json({ message: 'Reply posted successfully', review });
  } catch (error) {
    next(error);
  }
};

// Admin delete review (Hide/Moderation)
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.deleteOne(); // triggers calculation post hook

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
