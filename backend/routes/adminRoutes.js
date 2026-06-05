const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadImage, uploadVideo } = require('../config/cloudinary');
const {
  uploadMedia,
  getAdminMedia,
  editMedia,
  deleteMedia,
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getMessages,
  markMessageRead
} = require('../controllers/adminController');

// All routes below require admin access
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Media management
router.get('/media', getAdminMedia);
router.post('/upload/image', uploadImage.single('media'), uploadMedia);
router.post('/upload/video', uploadVideo.single('media'), uploadMedia);
router.put('/media/:id', editMedia);
router.delete('/media/:id', deleteMedia);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);

// Messages
router.get('/messages', getMessages);
router.put('/messages/:id/read', markMessageRead);

module.exports = router;