// Centralized error handler middleware
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId CastError
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Resource not found. Invalid ID format.';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: ${field}. Please use another value.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  console.error(`[Error Log]: ${message}`, err.stack);

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
