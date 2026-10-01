// Centralised error handler — all thrown errors funnel here.
// Keeps controller/service code free of res.status() boilerplate.
export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
    // Stack trace only in development so we don't leak internals
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
