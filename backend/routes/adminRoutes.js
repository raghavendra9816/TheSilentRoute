const express = require('express');
const router = express.Router();

// Import middleware
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Import cloudinary upload config
const { uploadImage, uploadVideo } = require('../config/cloudinary');

// Import controller
const adminController = require('../controllers/adminController');

// =============================================
// VERIFY IMPORTS
// =============================================
console.log('Admin Controller Functions:', {
  uploadMedia:       typeof adminController.uploadMedia,
  getAdminMedia:     typeof adminController.getAdminMedia,
  editMedia:         typeof adminController.editMedia,
  deleteMedia:       typeof adminController.deleteMedia,
  getDashboardStats: typeof adminController.getDashboardStats,
  getAllUsers:        typeof adminController.getAllUsers,
  toggleUserStatus:  typeof adminController.toggleUserStatus,
  getMessages:       typeof adminController.getMessages,
  markMessageRead:   typeof adminController.markMessageRead
});

// =============================================
// ALL ADMIN ROUTES REQUIRE AUTH + ADMIN ROLE
// =============================================
router.use(protect);
router.use(adminOnly);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Media management
router.get('/media',                              adminController.getAdminMedia);
router.post('/upload/image', uploadImage.single('media'), adminController.uploadMedia);
router.post('/upload/video', uploadVideo.single('media'), adminController.uploadMedia);
router.put('/media/:id',                          adminController.editMedia);
router.delete('/media/:id',                       adminController.deleteMedia);

// User management
router.get('/users',              adminController.getAllUsers);
router.put('/users/:id/toggle',   adminController.toggleUserStatus);

// Messages
router.get('/messages',           adminController.getMessages);
router.put('/messages/:id/read',  adminController.markMessageRead);

module.exports = router;