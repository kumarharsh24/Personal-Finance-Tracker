const router = require('express').Router();
const authController = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/auth');
const { validate, registerSchema, loginSchema, profileUpdateSchema } = require('../utils/validators');

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

// Google OAuth
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Protected routes
router.get('/me', ensureAuthenticated, authController.getMe);
router.put('/profile', ensureAuthenticated, validate(profileUpdateSchema), authController.updateProfile);

module.exports = router;
