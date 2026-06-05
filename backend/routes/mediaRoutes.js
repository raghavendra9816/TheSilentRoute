const express = require('express');
const router = express.Router();

// Import controller
const mediaController = require('../controllers/mediaController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');

// =============================================
// VERIFY IMPORTS
// =============================================
console.log('Media Controller Functions:', {
  getAllMedia:    typeof mediaController.getAllMedia,
  getSingleMedia: typeof mediaController.getSingleMedia,
  downloadMedia: typeof mediaController.downloadMedia,
  getCategories: typeof mediaController.getCategories
});

// =============================================
// PUBLIC ROUTES - No login needed
// =============================================
router.get('/',            mediaController.getAllMedia);
router.get('/categories',  mediaController.getCategories);
router.get('/:id',         mediaController.getSingleMedia);

// =============================================
// PROTECTED ROUTES - Login required
// =============================================
router.get('/:id/download', protect, mediaController.downloadMedia);

module.exports = router;