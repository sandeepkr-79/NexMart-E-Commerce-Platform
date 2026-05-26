import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import redisClient from '../config/redis.js';

// Protect routes - Verify JWT
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    // Check if token is blacklisted (logged out)
    const isBlacklisted = await redisClient.get(`blacklist_${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Session expired, please login again' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nexmart_jwt_access_secret_key_123!@#');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Check if seller status or user account is suspended/banned
    // We will simulate user suspension by checking role/status or adding a suspended flag if needed
    // In User Management, Admin can ban user. If a user is banned, we can set sellerStatus/role or simple flag
    if (user.sellerStatus === 'suspended' && req.originalUrl.includes('/api/seller')) {
      return res.status(403).json({ message: 'Your seller account has been suspended. Contact support.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('JWT auth error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Authorize roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user ? req.user.role : 'none'}) is not authorized to access this resource` 
      });
    }
    next();
  };
};
