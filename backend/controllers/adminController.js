const Media = require('../models/Media');
const User = require('../models/User');
const Contact = require('../models/Contact');
const { cloudinary } = require('../config/cloudinary');

// ===== UPLOAD MEDIA =====
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file to upload.'
      });
    }

    const { title, description, category, tags, location } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required.'
      });
    }

    const isVideo = req.file.mimetype.startsWith('video');
    const isImage = req.file.mimetype.startsWith('image');

    let thumbnailUrl = '';

    if (isImage) {
      // Generate smaller thumbnail
      thumbnailUrl = cloudinary.url(req.file.filename, {
        transformation: [
          { width: 600, height: 400, crop: 'fill', quality: 80 }
        ]
      });
    } else if (isVideo) {
      // Generate video thumbnail
      thumbnailUrl = cloudinary.url(req.file.filename, {
        resource_type: 'video',
        transformation: [
          { width: 600, height: 400, crop: 'fill' },
          { format: 'jpg', start_offset: '2' }
        ]
      });
    }

    const media = await Media.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      type: isVideo ? 'video' : 'image',
      url: req.file.path,
      publicId: req.file.filename,
      thumbnailUrl,
      category: category || 'travel',
      tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
      location: location ? location.trim() : '',
      fileSize: req.file.size || 0,
      uploadedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: `${isVideo ? 'Video' : 'Image'} uploaded successfully! 🎉`,
      data: media
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Upload failed: ' + error.message
    });
  }
};

// ===== GET ALL MEDIA FOR ADMIN =====
exports.getAdminMedia = async (req, res) => {
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

    res.status(200).json({
      success: true,
      count: media.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: media
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== EDIT MEDIA =====
exports.editMedia = async (req, res) => {
  try {
    const {
      title, description, category,
      tags, location, isActive, isFeatured
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category;
    if (location !== undefined) updateData.location = location.trim();
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (tags !== undefined) {
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

    res.status(200).json({
      success: true,
      message: 'Media updated successfully!',
      data: media
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== DELETE MEDIA =====
exports.deleteMedia = async (req, res) => {
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
      console.log('Cloudinary delete error:', cloudErr.message);
    }

    await Media.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Media deleted successfully!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== DASHBOARD STATS =====
exports.getDashboardStats = async (req, res) => {
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

    res.status(200).json({
      success: true,
      stats: {
        totalMedia,
        totalImages,
        totalVideos,
        totalUsers,
        activeMedia,
        totalViews: viewsAgg[0]?.total || 0,
        totalDownloads: downloadsAgg[0]?.total || 0,
        unreadMessages,
        recentMedia,
        recentUsers,
        categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET ALL USERS =====
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    let query = { role: 'user' };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== TOGGLE USER STATUS =====
exports.toggleUserStatus = async (req, res) => {
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

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully!`,
      isActive: user.isActive
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET ALL MESSAGES =====
exports.getMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== MARK MESSAGE AS READ =====
exports.markMessageRead = async (req, res) => {
  try {
    await Contact.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true, message: 'Message marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};