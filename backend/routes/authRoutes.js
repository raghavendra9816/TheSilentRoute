const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

console.log('Auth Controller Functions:', {
  register: typeof authController.register,
  login: typeof authController.login,
  getMe: typeof authController.getMe,
  updateProfile: typeof authController.updateProfile
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);

module.exports = router;