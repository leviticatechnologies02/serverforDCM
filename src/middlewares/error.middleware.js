import ApiError from '../utils/ApiError.js';

// Centralized error handling middleware
export const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let response = { success: false, message };

  // Handle common mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.keys(err.errors).map((k) => err.errors[k].message);
    response.errors = errors;
    response.message = 'Validation failed';
  }

  // Handle duplicate key
  if (err.code && err.code === 11000) {
    statusCode = 409;
    response.message = 'Duplicate key error';
    response.errors = err.keyValue || null;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    response.message = 'Authentication error';
  }

  // ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    response.message = err.message;
    if (err.details) response.details = err.details;
  }

  // In development include stack
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
