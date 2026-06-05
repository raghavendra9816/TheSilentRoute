const express = require('express');
const router = express.Router();

// Import controller
const authController = require('../controllers/authController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');

// =============================================
// VERIFY IMPORTS ARE FUNCTIONS - DEBUG CHECK
// =============================================
console.log('Auth Controller Functions:', {
  register:      typeof authController.register,
  login:         typeof authController.login,
  getMe:         typeof authController.getMe,
  updateProfile: typeof authController.updateProfile
});

// =============================================
// ROUTES
// =============================================
router.post('/register', authController.register);
router.post('/login',    authController.login);
router.get('/me',        protect, authController.getMe);
router.put('/profile',   protect, authController.updateProfile);

module.exports = router;