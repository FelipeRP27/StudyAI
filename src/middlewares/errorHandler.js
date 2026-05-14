const AppError = require('../config/appError');

function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: 'Route not found'
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const isOperational = err instanceof AppError;

  if (!isOperational || statusCode >= 500) {
    console.error('[errorHandler]', {
      method: req.method,
      path: req.originalUrl,
      userId: req.user?.id,
      statusCode,
      message,
      stack: err.stack
    });
  }

  res.status(statusCode).json({
    message
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
