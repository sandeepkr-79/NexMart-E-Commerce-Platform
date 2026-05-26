import jwt from 'jsonwebtoken';

export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'nexmart_jwt_access_secret_key_123!@#',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'nexmart_jwt_refresh_secret_key_456$%^',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const sendRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};
