import User from "../models/User.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
import {
  generateTokens,
  sendRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/generateToken.js";
import { sendEmail } from "../services/email.service.js";
import redisClient from "../config/redis.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Register User
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const user = new User({
      name,
      email,
      password, // hashed by mongoose pre-save hook
      isVerified: true, // Auto-verify on registration
    });

    await user.save();

    // Create cart and wishlist for user
    await Cart.create({ user: user._id, items: [] });
    await Wishlist.create({ user: user._id, products: [] });

    // Create session tokens
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    sendRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: "Registration successful!",
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sellerStatus: user.sellerStatus,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP - REMOVED (users now auto-verified on registration)

// Login User
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Handle token rotation
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    sendRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sellerStatus: user.sellerStatus,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token Rotation
export const refresh = async (req, res, next) => {
  try {
    const cookies = req.cookie || req.cookies;
    const token = cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const user = await User.findOne({ refreshToken: token });

    // If refresh token reuse is detected, blacklist all or force login
    if (!user) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_REFRESH_SECRET ||
            "nexmart_jwt_refresh_secret_key_456$%^",
        );
        // Token was valid but doesn't match active DB token -> Compromise detected
        const hackedUser = await User.findById(decoded.id);
        if (hackedUser) {
          hackedUser.refreshToken = "";
          await hackedUser.save();
        }
      } catch (err) {
        // Token was expired or invalid anyway
      }
      clearRefreshTokenCookie(res);
      return res
        .status(403)
        .json({ message: "Invalid refresh token, session expired" });
    }

    try {
      jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET ||
          "nexmart_jwt_refresh_secret_key_456$%^",
      );

      // Valid token -> Rotate it
      const { accessToken, refreshToken: newRefreshToken } =
        generateTokens(user);
      user.refreshToken = newRefreshToken;
      await user.save();

      sendRefreshTokenCookie(res, newRefreshToken);

      res.status(200).json({ accessToken });
    } catch (err) {
      // Refresh token expired
      user.refreshToken = "";
      await user.save();
      clearRefreshTokenCookie(res);
      return res
        .status(401)
        .json({ message: "Session expired, please login again" });
    }
  } catch (error) {
    next(error);
  }
};

// Logout User
export const logout = async (req, res, next) => {
  try {
    const cookies = req.cookie || req.cookies;
    const token = cookies?.refreshToken;

    if (token) {
      const user = await User.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = "";
        await user.save();
      }
    }

    // Blacklist access token
    if (req.token) {
      // Blacklist for 15 minutes (duration of access token)
      await redisClient.set(`blacklist_${req.token}`, "true", "EX", 15 * 60);
    }

    clearRefreshTokenCookie(res);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// Forgot Password Request
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "No user registered with this email" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`;
    const subject = "NexMart - Password Reset Link";
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Password Reset Requested</h2>
        <p>You requested a password reset for your NexMart account. Please click the button below to set a new password:</p>
        <div style="margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #4a154b; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 30 minutes. If you did not make this request, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject,
      html,
      text: `Reset your NexMart password here: ${resetUrl}`,
    });

    res
      .status(200)
      .json({ message: "Password reset link sent to your email." });
  } catch (error) {
    next(error);
  }
};

// Reset Password
export const resetPassword = async (req, res, next) => {
  try {
    const resetToken = req.params.token;
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired password reset link" });
    }

    user.password = req.body.password; // hashed by mongoose pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = ""; // invalidate active logins
    await user.save();

    res
      .status(200)
      .json({ message: "Password reset successfully. You can now login." });
  } catch (error) {
    next(error);
  }
};

// Google OAuth simulation login/signup
export const googleLogin = async (req, res, next) => {
  try {
    const { googleToken, email, name, avatar } = req.body;

    // In production, verify Google token using OAuth2 client
    // For local setup, we simulate by checking if email exists, or registering
    let user = await User.findOne({ email });

    if (!user) {
      // Create new Google verified user
      user = new User({
        name,
        email,
        password: crypto.randomBytes(16).toString("hex"), // dummy password
        role: "customer",
        isVerified: true,
        avatar,
        googleId: `google_${Math.random().toString(36).substring(2, 10)}`,
      });
      await user.save();
      await Cart.create({ user: user._id, items: [] });
      await Wishlist.create({ user: user._id, products: [] });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    sendRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sellerStatus: user.sellerStatus,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};
