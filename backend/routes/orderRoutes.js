import express from "express";
import {
  createOrder,
  confirmPayment,
  getMyOrders,
  getOrderById,
  updateShippingStatus,
  handleReturnRefund,
  printShippingLabel,
  exportOrdersCsv,
  handleRazorpayWebhook,
} from "../controllers/orderController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, createOrder);

router.post("/confirm-payment", protect, confirmPayment);
// Razorpay webhook endpoint (raw body required by signature verification)
router.post("/webhook", express.raw({ type: "*/*" }), handleRazorpayWebhook);
router.get("/my-orders", protect, getMyOrders);
router.get("/export", protect, authorizeRoles("admin"), exportOrdersCsv);

router.route("/:id").get(protect, getOrderById);

router.put(
  "/:id/status",
  protect,
  authorizeRoles("seller", "admin"),
  updateShippingStatus,
);
router.post(
  "/:id/refund",
  protect,
  authorizeRoles("seller", "admin"),
  handleReturnRefund,
);
router.get(
  "/:id/label",
  protect,
  authorizeRoles("seller", "admin"),
  printShippingLabel,
);

export default router;
