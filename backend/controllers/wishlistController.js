import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// Get current user's wishlist
export const getMyWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
      "products",
    );
    if (!wishlist) return res.status(200).json({ products: [] });
    res.json({ products: wishlist.products });
  } catch (err) {
    console.error("Get wishlist error:", err.message);
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};

// Add product to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      const created = await Wishlist.create({
        user: req.user._id,
        products: [productId],
      });
      return res.status(201).json({ products: created.products });
    }

    // Prevent duplicates
    if (wishlist.products.includes(productId)) {
      return res.status(200).json({ products: wishlist.products });
    }

    wishlist.products.push(productId);
    await wishlist.save();
    res.status(201).json({ products: wishlist.products });
  } catch (err) {
    console.error("Add wishlist error:", err.message);
    res.status(500).json({ message: "Failed to add to wishlist" });
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) return res.status(200).json({ products: [] });

    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId.toString(),
    );
    await wishlist.save();
    res.json({ products: wishlist.products });
  } catch (err) {
    console.error("Remove wishlist error:", err.message);
    res.status(500).json({ message: "Failed to remove from wishlist" });
  }
};

export default { getMyWishlist, addToWishlist, removeFromWishlist };
