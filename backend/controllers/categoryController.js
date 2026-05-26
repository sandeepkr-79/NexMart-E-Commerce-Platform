import Category from '../models/Category.js';

// Get all categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().populate('parentCategory', 'name');
    res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
};

// Create a category (Admin only)
export const createCategory = async (req, res, next) => {
  try {
    const { name, icon, parentCategory } = req.body;
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({
      name,
      slug,
      icon,
      parentCategory: parentCategory || null
    });

    await category.save();
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    next(error);
  }
};

// Delete category (Admin only)
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete sub-categories that reference this as parent
    await Category.deleteMany({ parentCategory: category._id });
    await Category.findByIdAndDelete(category._id);

    res.status(200).json({ message: 'Category and its sub-categories removed successfully' });
  } catch (error) {
    next(error);
  }
};
