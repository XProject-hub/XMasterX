const UserProfile = require('../models/UserProfile');
const Channel = require('../models/Channel');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    let userProfile = await UserProfile.findOne({ user: req.user.id })
      .populate('favorites.channel', 'name provider format isLive')
      .populate('watchHistory.channel', 'name provider format isLive');
    
    // If profile doesn't exist, create one
    if (!userProfile) {
      userProfile = await UserProfile.create({ user: req.user.id });
    }
    
    res.status(200).json({ success: true, data: userProfile });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ success: false, message: 'Error getting user profile' });
  }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { defaultCategory, defaultLanguage, showOnlyLive, resultsPerPage, theme } = req.body;
    
    let userProfile = await UserProfile.findOne({ user: req.user.id });
    
    // If profile doesn't exist, create one
    if (!userProfile) {
      userProfile = await UserProfile.create({ user: req.user.id });
    }
    
    // Update preferences
    const preferences = {};
    if (defaultCategory !== undefined) preferences.defaultCategory = defaultCategory;
    if (defaultLanguage !== undefined) preferences.defaultLanguage = defaultLanguage;
    if (showOnlyLive !== undefined) preferences.showOnlyLive = showOnlyLive;
    if (resultsPerPage !== undefined) preferences.resultsPerPage = resultsPerPage;
    if (theme !== undefined) preferences.theme = theme;
    
    await userProfile.updatePreferences(preferences);
    
    res.status(200).json({ 
      success: true, 
      message: 'Preferences updated successfully',
      data: userProfile.preferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ success: false, message: 'Error updating preferences' });
  }
};

// Add channel to favorites
exports.addFavorite = async (req, res) => {
  try {
    const { channelId } = req.body;
    
    // Check if channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }
    
    let userProfile = await UserProfile.findOne({ user: req.user.id });
    
    // If profile doesn't exist, create one
    if (!userProfile) {
      userProfile = await UserProfile.create({ user: req.user.id });
    }
    
    // Add to favorites
    const added = await userProfile.addFavorite(channelId);
    
    if (added) {
      res.status(200).json({ 
        success: true, 
        message: 'Channel added to favorites' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Channel is already in favorites' 
      });
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ success: false, message: 'Error adding to favorites' });
  }
};

// Remove channel from favorites
exports.removeFavorite = async (req, res) => {
  try {
    const { channelId } = req.params;
    
    let userProfile = await UserProfile.findOne({ user: req.user.id });
    
    if (!userProfile) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }
    
    // Remove from favorites
    const removed = await userProfile.removeFavorite(channelId);
    
    if (removed) {
      res.status(200).json({ 
        success: true, 
        message: 'Channel removed from favorites' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Channel is not in favorites' 
      });
    }
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ success: false, message: 'Error removing from favorites' });
  }
};

// Get user favorites
exports.getFavorites = async (req, res) => {
  try {
    const userProfile = await UserProfile.findOne({ user: req.user.id })
      .populate('favorites.channel');
    
    if (!userProfile) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      data: userProfile.favorites 
    });
  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({ success: false, message: 'Error getting favorites' });
  }
};

// Add to watch history
exports.addToWatchHistory = async (req, res) => {
  try {
    const { channelId, duration } = req.body;
    
    // Check if channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }
    
    let userProfile = await UserProfile.findOne({ user: req.user.id });
    
    // If profile doesn't exist, create one
    if (!userProfile) {
      userProfile = await UserProfile.create({ user: req.user.id });
    }
    
    // Add to watch history
    await userProfile.addToWatchHistory(channelId, duration || 0);
    
    res.status(200).json({ 
      success: true, 
      message: 'Added to watch history' 
    });
  } catch (error) {
    console.error('Error adding to watch history:', error);
    res.status(500).json({ success: false, message: 'Error adding to watch history' });
  }
};

// Get watch history
exports.getWatchHistory = async (req, res) => {
  try {
    const userProfile = await UserProfile.findOne({ user: req.user.id })
      .populate('watchHistory.channel');
    
    if (!userProfile) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      data: userProfile.watchHistory 
    });
  } catch (error) {
    console.error('Error getting watch history:', error);
    res.status(500).json({ success: false, message: 'Error getting watch history' });
  }
};

// Clear watch history
exports.clearWatchHistory = async (req, res) => {
  try {
    let userProfile = await UserProfile.findOne({ user: req.user.id });
    
    if (!userProfile) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }
    
    // Clear watch history
    await userProfile.clearWatchHistory();
    
    res.status(200).json({ 
      success: true, 
      message: 'Watch history cleared' 
    });
  } catch (error) {
    console.error('Error clearing watch history:', error);
    res.status(500).json({ success: false, message: 'Error clearing watch history' });
  }
};
