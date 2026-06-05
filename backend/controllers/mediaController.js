const Media = require('../models/Media');
const { cloudinary } = require('../config/cloudinary');

// =============================================
// GET ALL MEDIA - PUBLIC
// =============================================
const getAllMedia = async (req, res) => {
  try {
    const {
      type,
      category,
      page = 1,
      limit = 12,
      search,
      sort = 'newest',
      featured
    } = req.query;

    let query = { isActive: true };

    if (type && type !== 'all') query.type = type;
    if (category && category !== 'all') query.category = category;
    if (featured === 'true') query.isFeatured = true;

    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location:    { $regex: search, $options: 'i' } },
        { tags:        { $in: [new RegExp(search, 'i')] } }
      ];
    }

    let sortOption = {};
    switch (sort) {
      case 'newest':    sortOption = { createdAt: -1 }; break;
      case 'oldest':    sortOption = { createdAt:  1 }; break;
      case 'popular':   sortOption = { views:     -1 }; break;
      case 'downloads': sortOption = { downloads: -1 }; break;
      default:          sortOption = { createdAt: -1 };
    }

    const total = await Media.countDocuments(query);
    const media = await Media.find(query)
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('uploadedBy', 'username')
      .select('-watermarkedUrl');

    return res.status(200).json({
      success: true,
      count: media.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: media
    });

  } catch (error) {
    console.error('getAllMedia Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// GET SINGLE MEDIA - PUBLIC
// =============================================
const getSingleMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)
      .populate('uploadedBy', 'username');

    if (!media || !media.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Media not found.'
      });
    }

    await Media.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    return res.status(200).json({
      success: true,
      data: media
    });

  } catch (error) {
    console.error('getSingleMedia Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// DOWNLOAD WITH WATERMARK - LOGIN REQUIRED
// =============================================
const downloadMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media || !media.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Media not found.'
      });
    }

    let downloadUrl;

    if (media.type === 'image') {
      downloadUrl = cloudinary.url(media.publicId, {
        transformation: [
          { width: 1920, crop: 'limit', quality: 85 },
          {
            overlay: {
              font_family: 'Arial',
              font_size: 55,
              font_weight: 'bold',
              text: 'The%20Silent%20Route'
            },
            color: 'white',
            opacity: 55,
            gravity: 'center',
            angle: -30
          },
          {
            overlay: {
              font_family: 'Arial',
              font_size: 30,
              font_weight: 'bold',
              text: 'The%20Silent%20Route'
            },
            color: 'white',
            opacity: 40,
            gravity: 'south_east',
            x: 20,
            y: 20
          }
        ]
      });
    } else {
      downloadUrl = media.watermarkedUrl || media.url;
    }

    await Media.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
    await req.user.updateOne({ $inc: { downloadCount: 1 } });

    return res.status(200).json({
      success: true,
      message: 'Download ready! Watermark has been added.',
      downloadUrl,
      filename: `thesilentroute_${media.title.replace(/\s+/g, '_').toLowerCase()}`,
      type: media.type
    });

  } catch (error) {
    console.error('downloadMedia Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// GET CATEGORIES
// =============================================
const getCategories = async (req, res) => {
  try {
    const categories = await Media.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('getCategories Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// EXPORTS
// =============================================
module.exports = {
  getAllMedia,
  getSingleMedia,
  downloadMedia,
  getCategories
};