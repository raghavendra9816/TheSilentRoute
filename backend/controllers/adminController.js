const Media   = require('../models/Media');
const User    = require('../models/User');
const Contact = require('../models/Contact');
const { cloudinary } = require('../config/cloudinary');

// =============================================
// UPLOAD MEDIA
// =============================================
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file to upload.'
      });
    }

    const { title, description, category, tags, location, isFeatured } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required.'
      });
    }

    const isVideo = req.file.mimetype.startsWith('video');

    let thumbnailUrl = '';

    if (!isVideo) {
      thumbnailUrl = cloudinary.url(req.file.filename, {
        transformation: [
          { width: 600, height: 400, crop: 'fill', quality: 80 }
        ]
      });
    } else {
      thumbnailUrl = cloudinary.url(req.file.filename, {
        resource_type: 'video',
        transformation: [
          { width: 600, height: 400, crop: 'fill' },
          { format: 'jpg', start_offset: '2' }
        ]
      });
    }

    const media = await Media.create({
      title:       title.trim(),
      description: description ? description.trim() : '',
      type:        isVideo ? 'video' : 'image',
      url:         req.file.path,
      publicId:    req.file.filename,
      thumbnailUrl,
      category:    category || 'travel',
      tags:        tags
        ? tags.split(',').map(t => t.trim()).filter(t => t)
        : [],
      location:    location ? location.trim() : '',
      fileSize:    req.file.size || 0,
      isFeatured:  isFeatured === 'true',
      uploadedBy:  req.user._id
    });

    return res.status(201).json({
      success: true,
      message: `${isVideo ? 'Video' : 'Image'} uploaded successfully!`,
      data: media
    });

  } catch (error) {
    console.error('uploadMedia Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Upload failed: ' + error.message
    });
  }
};

// =============================================
// GET ALL MEDIA FOR ADMIN
// =============================================
const getAdminMedia = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, search } = req.query;
    let query = {};

    if (type && type !== 'all') query.type = type;
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const total = await Media.countDocuments(query);
    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('uploadedBy', 'username email');

    return res.status(200).json({
      success: true,
      count: media.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: media
    });

  } catch (error) {
    console.error('getAdminMedia Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// EDIT MEDIA
// =============================================
const editMedia = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      tags,
      location,
      isActive,
      isFeatured
    } = req.body;

    const updateData = {};
    if (title       !== undefined) updateData.title       = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category    !== undefined) updateData.category    = category;
    if (location    !== undefined) updateData.location    = location.trim();
    if (isActive    !== undefined) updateData.isActive    = isActive;
    if (isFeatured  !== undefined) updateData.isFeatured  = isFeatured;
    if (tags        !== undefined) {
      updateData.tags = typeof tags === 'string'
        ? tags.split(',').map(t => t.trim()).filter(t => t)
        : tags;
    }
    updateData.updatedAt = new Date();

    const media = await Media.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Media updated successfully!',
      data: media
    });

  } catch (error) {
    console.error('editMedia Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// DELETE MEDIA
// =============================================
const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found.'
      });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(
        media.publicId,
        { resource_type: media.type === 'video' ? 'video' : 'image' }
      );
    } catch (cloudErr) {
      console.log('Cloudinary delete warning:', cloudErr.message);
    }

    await Media.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Media deleted successfully!'
    });

  } catch (error) {
    console.error('deleteMedia Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// DASHBOARD STATS
// =============================================
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalMedia,
      totalImages,
      totalVideos,
      totalUsers,
      activeMedia,
      viewsAgg,
      downloadsAgg,
      recentMedia,
      recentUsers,
      unreadMessages,
      categoryStats
    ] = await Promise.all([
      Media.countDocuments(),
      Media.countDocuments({ type: 'image' }),
      Media.countDocuments({ type: 'video' }),
      User.countDocuments({ role: 'user' }),
      Media.countDocuments({ isActive: true }),
      Media.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Media.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }]),
      Media.find().sort({ createdAt: -1 }).limit(5).populate('uploadedBy', 'username'),
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5),
      Contact.countDocuments({ isRead: false }),
      Media.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalMedia,
        totalImages,
        totalVideos,
        totalUsers,
        activeMedia,
        totalViews:      viewsAgg[0]?.total      || 0,
        totalDownloads:  downloadsAgg[0]?.total  || 0,
        unreadMessages,
        recentMedia,
        recentUsers,
        categoryStats
      }
    });

  } catch (error) {
    console.error('getDashboardStats Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// GET ALL USERS
// =============================================
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    let query = { role: 'user' };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      data: users
    });

  } catch (error) {
    console.error('getAllUsers Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// TOGGLE USER STATUS
// =============================================
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully!`,
      isActive: user.isActive
    });

  } catch (error) {
    console.error('toggleUserStatus Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// GET ALL MESSAGES
// =============================================
const getMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });

  } catch (error) {
    console.error('getMessages Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// MARK MESSAGE AS READ
// =============================================
const markMessageRead = async (req, res) => {
  try {
    await Contact.findByIdAndUpdate(req.params.id, { isRead: true });

    return res.status(200).json({
      success: true,
      message: 'Message marked as read.'
    });

  } catch (error) {
    console.error('markMessageRead Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// EXPORTS - ALL FUNCTIONS
// =============================================
module.exports = {
  uploadMedia,
  getAdminMedia,
  editMedia,
  deleteMedia,
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getMessages,
  markMessageRead
};