
function errorMiddleware(err, req, res, next) {
  console.error(err.stack || err.message);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? 'Internal server error'
        : err.message || 'Something went wrong',
  });
}

module.exports = errorMiddleware;
