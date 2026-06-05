const express = require('express');
const router = express.Router();
const {
  getAllMedia,
  getSingleMedia,
  downloadMedia,
  getCategories
} = require('../controllers/mediaController');
const { protect } = require('../middleware/authMiddleware');

// Public routes - anyone can view
router.get('/', getAllMedia);
router.get('/categories', getCategories);
router.get('/:id', getSingleMedia);

// Protected routes - must be logged in
router.get('/:id/download', protect, downloadMedia);

module.exports = router;