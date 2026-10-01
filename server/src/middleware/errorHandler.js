// Centralised error handler — every next(err) call lands here.
// Keeps controllers clean; they just throw or call next(err).
export const errorHandler = (err, req, res, _next) => {
  // Allow controllers/services to set a custom HTTP status
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log server errors so they appear in console / log aggregator
  if (statusCode >= 500) {
    console.error(`[${req.method}] ${req.originalUrl} — ${message}`);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    // Structured validation errors forwarded from express-validator
    ...(err.errors && { errors: err.errors }),
    // Stack only in development — never leak internals to clients
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Helper: create an error with a custom HTTP status code
export const createError = (message, statusCode = 500, errors = null) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (errors) err.errors = errors;
  return err;
};
