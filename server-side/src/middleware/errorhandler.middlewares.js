// middleware/errorHandler.js
import ApiError from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error Handler Caught:", {
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle ApiError instances
  if (err instanceof ApiError) {
    console.log('✅ Returning ApiError as JSON response');
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
      statusCode: err.statusCode
    });
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({
      success: false,
      message: `Validation Error: ${message}`,
      data: null,
      statusCode: 400
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      data: null,
      statusCode: 409
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      data: null,
      statusCode: 401
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      data: null,
      statusCode: 401
    });
  }

  console.log('❌ Unexpected error, returning 500');
  // Fallback for unexpected errors
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : "Internal Server Error",
    data: null,
    statusCode: 500,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export { errorHandler };
