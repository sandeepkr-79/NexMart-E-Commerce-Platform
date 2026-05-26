import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'Size', 'Color'
  options: [{ type: String, required: true }] // e.g., ['S', 'M', 'XL'] or ['Red', 'Blue']
}, { _id: false });

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: 'text' },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  images: [{ type: String }],
  variants: [variantSchema],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratings: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  tags: [{ type: String }],
  aiDescription: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Text indexing for searches
productSchema.index({ title: 'text', description: 'text', brand: 'text', tags: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;
