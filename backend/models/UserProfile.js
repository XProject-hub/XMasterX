const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  favorites: [{
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  watchHistory: [{
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    watchedAt: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: Number, // Duration in seconds
      default: 0
    }
  }],
  preferences: {
    defaultCategory: {
      type: String,
      default: 'All'
    },
    defaultLanguage: {
      type: String,
      default: 'All'
    },
    showOnlyLive: {
      type: Boolean,
      default: false
    },
    resultsPerPage: {
      type: Number,
      default: 10
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
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

// Pre-save middleware to update the updatedAt field
UserProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to add a channel to favorites
UserProfileSchema.methods.addFavorite = async function(channelId) {
  // Check if already in favorites
  const existingFavorite = this.favorites.find(
    fav => fav.channel.toString() === channelId.toString()
  );
  
  if (!existingFavorite) {
    this.favorites.push({
      channel: channelId,
      addedAt: new Date()
    });
    await this.save();
    
    // Update channel favorite count
    const Channel = mongoose.model('Channel');
    await Channel.findByIdAndUpdate(channelId, { $inc: { favoriteCount: 1 } });
    
    return true;
  }
  
  return false;
};

// Method to remove a channel from favorites
UserProfileSchema.methods.removeFavorite = async function(channelId) {
  const initialLength = this.favorites.length;
  
  this.favorites = this.favorites.filter(
    fav => fav.channel.toString() !== channelId.toString()
  );
  
  if (initialLength !== this.favorites.length) {
    await this.save();
    
    // Update channel favorite count
    const Channel = mongoose.model('Channel');
    await Channel.findByIdAndUpdate(channelId, { $inc: { favoriteCount: -1 } });
    
    return true;
  }
  
  return false;
};

// Method to add to watch history
UserProfileSchema.methods.addToWatchHistory = async function(channelId, duration = 0) {
  // Check if already in recent history
  const recentEntry = this.watchHistory.find(
    entry => 
      entry.channel.toString() === channelId.toString() && 
      (new Date() - entry.watchedAt) < 3600000 // Within the last hour
  );
  
  if (recentEntry) {
    // Update existing entry
    recentEntry.watchedAt = new Date();
    recentEntry.duration += duration;
  } else {
    // Add new entry
    this.watchHistory.unshift({
      channel: channelId,
      watchedAt: new Date(),
      duration
    });
    
    // Keep history limited to 100 entries
    if (this.watchHistory.length > 100) {
      this.watchHistory = this.watchHistory.slice(0, 100);
    }
  }
  
  await this.save();
  
  // Update channel view count
  const Channel = mongoose.model('Channel');
  await Channel.findByIdAndUpdate(channelId, { $inc: { viewCount: 1 } });
  
  return true;
};

// Method to clear watch history
UserProfileSchema.methods.clearWatchHistory = async function() {
  this.watchHistory = [];
  return this.save();
};

// Method to update preferences
UserProfileSchema.methods.updatePreferences = async function(preferences) {
  this.preferences = { ...this.preferences, ...preferences };
  return this.save();
};

module.exports = mongoose.model('UserProfile', UserProfileSchema);
