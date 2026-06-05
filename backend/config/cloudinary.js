const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ===== IMAGE STORAGE =====
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'thesilentroute/images',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto' }
      ],
      public_id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
});

// ===== VIDEO STORAGE =====
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'thesilentroute/videos',
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
      public_id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
});

// File size limits
const imageLimits = { fileSize: 10 * 1024 * 1024 }; // 10MB
const videoLimits = { fileSize: 500 * 1024 * 1024 }; // 500MB

const uploadImage = multer({
  storage: imageStorage,
  limits: imageLimits,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: videoLimits,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

module.exports = { cloudinary, uploadImage, uploadVideo };