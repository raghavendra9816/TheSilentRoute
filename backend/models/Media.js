const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: [true, 'Media type is required']
  },
  url: {
    type: String,
    required: [true, 'Media URL is required']
  },
  publicId: {
    type: String,
    required: [true, 'Public ID is required']
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  watermarkedUrl: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['travel', 'nature', 'adventure', 'culture', 'food', 'people', 'other'],
    default: 'travel'
  },
  tags: {
    type: [String],
    default: []
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  duration: {
    type: String,
    default: ''
  },
  fileSize: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
mediaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster search
mediaSchema.index({ title: 'text', description: 'text', tags: 'text' });
mediaSchema.index({ type: 1, category: 1, isActive: 1 });

module.exports = mongoose.model('Media', mediaSchema);