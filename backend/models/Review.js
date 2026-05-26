import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  body: { type: String, required: true },
  images: [{ type: String }],
  helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sellerReply: {
    comment: { type: String },
    repliedAt: { type: Date }
  },
  createdAt: { type: Date, default: Date.now }
});

// Calculate average ratings and reviewCount for product
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        ratings: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      ratings: Math.round(stats[0].ratings * 10) / 10,
      reviewCount: stats[0].reviewCount
    });
  } else {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      ratings: 0,
      reviewCount: 0
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.product);
});

reviewSchema.post('deleteOne', { document: true, query: false }, function () {
  this.constructor.calculateAverageRating(this.product);
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
