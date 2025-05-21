const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  provider: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  format: {
    type: String,
    enum: ['m3u', 'm3u8', 'mp4', 'hls', 'other'],
    required: true,
    index: true
  },
  isLive: {
    type: Boolean,
    default: false,
    index: true
  },
  lastChecked: {
    type: Date,
    default: Date.now
  },
  lastLive: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // New fields for categorization
  category: {
    type: String,
    trim: true,
    default: 'Uncategorized',
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  channelLanguage: {
    type: String,
    trim: true,
    default: 'Unknown',
    index: true
  },
  country: {
    type: String,
    trim: true,
    default: 'Unknown',
    index: true
  },
  // Statistics fields
  viewCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  uptime: {
    type: Number, // Percentage of time the channel is live
    default: 0
  },
  // Metadata fields
  logo: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  epgId: {
    type: String,
    trim: true
  }
});

// Index for faster searching
ChannelSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for full text search
ChannelSchema.virtual('searchText').get(function() {
  return `${this.name} ${this.provider} ${this.category} ${this.tags.join(' ')} ${this.channelLanguage} ${this.country} ${this.description || ''}`;
});

// Pre-save middleware to update the updatedAt field
ChannelSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to update view count
ChannelSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  return this.save();
};

// Method to update favorite count
ChannelSchema.methods.updateFavoriteCount = async function(increment) {
  this.favoriteCount += increment ? 1 : -1;
  return this.save();
};

// Method to calculate uptime
ChannelSchema.methods.calculateUptime = async function(checkHistory) {
  if (!checkHistory || checkHistory.length === 0) {
    return 0;
  }
  
  const liveChecks = checkHistory.filter(check => check.isLive).length;
  this.uptime = (liveChecks / checkHistory.length) * 100;
  return this.save();
};

module.exports = mongoose.model('Channel', ChannelSchema);
