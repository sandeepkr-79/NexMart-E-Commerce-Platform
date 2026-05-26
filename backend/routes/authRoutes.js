import express from "express";
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  googleLogin,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/google", googleLogin);

export default router;
