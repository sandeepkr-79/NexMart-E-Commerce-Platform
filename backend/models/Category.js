import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, index: true },
  icon: { type: String, default: '' },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;
