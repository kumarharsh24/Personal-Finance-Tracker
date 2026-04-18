/**
 * Centralized error handling middleware.
 * Returns consistent JSON error responses.
 */
function errorHandler(err, req, res, _next) {
  console.error('Error:', err.message || err);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details.map((d) => d.message),
    });
  }

  // Knex / PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({ error: 'A record with this data already exists' });
      case '23503': // foreign_key_violation
        return res.status(400).json({ error: 'Referenced record does not exist' });
      case '23502': // not_null_violation
        return res.status(400).json({ error: `Missing required field: ${err.column}` });
      default:
        break;
    }
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : message,
  });
}

module.exports = errorHandler;
