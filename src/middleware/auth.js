/**
 * Middleware to ensure the user is authenticated.
 * Redirects to login page or returns 401 for API requests.
 */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  // API requests get JSON response
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Page requests get redirected
  return res.redirect('/');
}

/**
 * Middleware to ensure the user owns the resource.
 * Checks that the user_id on the resource matches the authenticated user.
 */
function ensureOwnership(resourceTable) {
  return async (req, res, next) => {
    try {
      const db = require('../config/db');
      const resourceId = req.params.id;
      const resource = await db(resourceTable)
        .where({ id: resourceId })
        .first();

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      if (resource.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      req.resource = resource;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { ensureAuthenticated, ensureOwnership };
