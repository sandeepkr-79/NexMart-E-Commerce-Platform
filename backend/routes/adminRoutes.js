import express from "express";
import { getAllOrders } from "../controllers/orderController.js";
import {
  getAllUsers,
  createUser,
  updateUser,
  updateUserRole,
  banUser,
  deleteUser,
  getSellerApplications,
  createSeller,
  updateSeller,
  deleteSeller,
  approveSellerApplication,
  sendMassNotification,
  getAllProductsAdmin,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  approveProduct,
  getPlatformStats,
} from "../controllers/adminController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { uploadArray } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

// User Management
router.route("/users").get(getAllUsers).post(createUser);
router.put("/users/:id", updateUser);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/ban", banUser);
router.delete("/users/:id", deleteUser); // soft delete

// Seller Management
router.route("/sellers").get(getSellerApplications).post(createSeller);
router.route("/sellers/:id").put(updateSeller).delete(deleteSeller);
router.put("/sellers/:id/verify", approveSellerApplication);
router.post("/sellers/notify", sendMassNotification);

// Order Management
router.get("/orders", protect, authorizeRoles("admin"), getAllOrders);

// Product Management
router.route("/products").get(getAllProductsAdmin).post(uploadArray("images", 5), createProductAdmin);
router.route("/products/:id").put(uploadArray("images", 5), updateProductAdmin).delete(deleteProductAdmin);
router.put("/products/:id/approve", approveProduct);

// Platform Stats
router.get("/stats", getPlatformStats);

export default router;
