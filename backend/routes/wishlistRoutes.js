import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController.js";

const router = express.Router();

// All wishlist actions require authentication
router.get("/", protect, getMyWishlist);
router.post("/:productId", protect, addToWishlist);
router.delete("/:productId", protect, removeFromWishlist);

export default router;
