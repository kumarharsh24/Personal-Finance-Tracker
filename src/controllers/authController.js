const passport = require('passport');
const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.validatedBody);

    // Auto-login after registration
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json({ message: 'Registration successful', user });
    });
  } catch (err) {
    next(err);
  }
}

function login(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Login failed' });
    }

    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      res.json({ message: 'Login successful', user });
    });
  })(req, res, next);
}

function logout(req, res, next) {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((sessionErr) => {
      if (sessionErr) console.error('Session destroy error:', sessionErr);
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
}

function getMe(req, res) {
  res.json({ user: req.user });
}

async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateUserProfile(
      req.user.id,
      req.validatedBody
    );
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    next(err);
  }
}

// Google OAuth initiate
function googleAuth(req, res, next) {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID === 'your-google-client-id'
  ) {
    return res.status(503).json({
      error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(
    req,
    res,
    next
  );
}

// Google OAuth callback
function googleCallback(req, res, next) {
  passport.authenticate('google', {
    failureRedirect: '/?error=google_auth_failed',
    successRedirect: '/dashboard.html',
  })(req, res, next);
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  googleAuth,
  googleCallback,
};
