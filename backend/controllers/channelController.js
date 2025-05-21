const Channel = require('../models/Channel');
const UserProfile = require('../models/UserProfile');
const ChannelCheckHistory = require('../models/ChannelCheckHistory');
const m3uParser = require('../utils/m3uParser');
const statusChecker = require('../utils/statusChecker');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (_req, file, cb) {
    const filetypes = /m3u|m3u8|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only M3U, M3U8, or TXT files are allowed'));
  }
}).single('file');

// Controller methods
const channelController = {
  // Search and filter channels
  searchChannels: async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({ 
          success: false, 
          message: 'Search query is required' 
        });
      }
      
      const channels = await Channel.find({ 
        name: { $regex: query, $options: 'i' } 
      }).sort({ name: 1, provider: 1 });
      
      res.status(200).json({ success: true, data: channels });
    } catch (error) {
      console.error('Error searching channels:', error);
      res.status(500).json({ success: false, message: 'Error searching channels' });
    }
  },

  // Get all channels
  getAllChannels: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sort = 'name', 
        order = 'asc',
        category,
        provider,
        format,
        status
      } = req.query;
      
      // Build filter object
      const filter = {};
      
      if (category && category !== 'All') {
        filter.category = category;
      }
      
      if (provider && provider !== 'All') {
        filter.provider = provider;
      }
      
      if (format && format !== 'All') {
        filter.format = format.toLowerCase();
      }
      
      if (status) {
        filter.isLive = status === 'live';
      }
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Determine sort order
      const sortOptions = {};
      sortOptions[sort] = order === 'asc' ? 1 : -1;
      
      // Execute query with pagination
      const channels = await Channel.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));
      
      // Get total count for pagination
      const total = await Channel.countDocuments(filter);
      
      res.status(200).json({ 
        success: true, 
        data: channels,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching channels:', error);
      res.status(500).json({ success: false, message: 'Error fetching channels' });
    }
  },

  // Get channel by ID
  getChannelById: async (req, res) => {
    try {
      const { id } = req.params;
      const channel = await Channel.findById(id);
      
      if (!channel) {
        return res.status(404).json({ success: false, message: 'Channel not found' });
      }
      
      // Increment view count if user is provided
      if (req.user) {
        // Update user's watch history
        const userProfile = await UserProfile.findOne({ user: req.user.id });
        if (userProfile && typeof userProfile.addToWatchHistory === 'function') {
          await userProfile.addToWatchHistory(channel._id);
        }
      }
      
      res.status(200).json({ success: true, data: channel });
    } catch (error) {
      console.error('Error fetching channel:', error);
      res.status(500).json({ success: false, message: 'Error fetching channel' });
    }
  },

  // Get channel statistics
  getChannelStatistics: async (req, res) => {
    try {
      const { id } = req.params;
      
      const stats = await statusChecker.getChannelStatistics(id);
      
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      console.error('Error getting channel statistics:', error);
      res.status(500).json({ success: false, message: 'Error getting channel statistics' });
    }
  },

  // Get system statistics
  getSystemStatistics: async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days) : 7;
      
      // Get overall system statistics
      const stats = await ChannelCheckHistory.getSystemStats(days);
      
      // Get channel counts
      const totalChannels = await Channel.countDocuments();
      const liveChannels = await Channel.countDocuments({ isLive: true });
      const downChannels = await Channel.countDocuments({ isLive: false });
      
      // Get category distribution
      const categoryDistribution = await Channel.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      // Get provider distribution
      const providerDistribution = await Channel.aggregate([
        { $group: { _id: '$provider', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      // Get format distribution
      const formatDistribution = await Channel.aggregate([
        { $group: { _id: '$format', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      res.status(200).json({ 
        success: true, 
        data: {
          channelCounts: {
            total: totalChannels,
            live: liveChannels,
            down: downChannels,
            livePercentage: totalChannels > 0 ? (liveChannels / totalChannels) * 100 : 0
          },
          categoryDistribution,
          providerDistribution,
          formatDistribution,
          dailyStats: stats
        }
      });
    } catch (error) {
      console.error('Error getting system statistics:', error);
      res.status(500).json({ success: false, message: 'Error getting system statistics' });
    }
  },

  // Get categories
  getCategories: async (_req, res) => {
    try {
      const categories = await Channel.distinct('category');
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ success: false, message: 'Error fetching categories' });
    }
  },

  // Get providers
  getProviders: async (_req, res) => {
    try {
      const providers = await Channel.distinct('provider');
      res.status(200).json({ success: true, data: providers });
    } catch (error) {
      console.error('Error fetching providers:', error);
      res.status(500).json({ success: false, message: 'Error fetching providers' });
    }
  },

  // Get languages
  getLanguages: async (_req, res) => {
    try {
      const languages = await Channel.distinct('channelLanguage');
      res.status(200).json({ success: true, data: languages });
    } catch (error) {
      console.error('Error fetching languages:', error);
      res.status(500).json({ success: false, message: 'Error fetching languages' });
    }
  },

  // Get countries
  getCountries: async (_req, res) => {
    try {
      const countries = await Channel.distinct('country');
      res.status(200).json({ success: true, data: countries });
    } catch (error) {
      console.error('Error fetching countries:', error);
      res.status(500).json({ success: false, message: 'Error fetching countries' });
    }
  },

  // Get tags
  getTags: async (_req, res) => {
    try {
      const tags = await Channel.distinct('tags');
      res.status(200).json({ success: true, data: tags });
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ success: false, message: 'Error fetching tags' });
    }
  },

  // Upload file
  uploadFile: async (req, res) => {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      try {
        const provider = req.body.provider || 'Unknown Provider';
        const category = req.body.category || 'Uncategorized';
        const language = req.body.language || 'Unknown';
        const country = req.body.country || 'Unknown';
        const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];
        
        const channels = await m3uParser.parseFromFile(req.file.path, provider);
        
        // Save channels to database
        let savedCount = 0;
        for (const channel of channels) {
          // Check if channel already exists with same URL
          const existingChannel = await Channel.findOne({ url: channel.url });
          if (!existingChannel) {
            const newChannel = new Channel({
              ...channel,
              category,
              channelLanguage: language,
              country,
              tags
            });
            await newChannel.save();
            savedCount++;
          }
        }
        
        // Delete the file after processing
        fs.unlinkSync(req.file.path);
        
        res.status(200).json({ 
          success: true, 
          message: `File processed successfully. Added ${savedCount} new channels.` 
        });
      } catch (error) {
        console.error('Error processing uploaded file:', error);
        res.status(500).json({ success: false, message: 'Error processing file' });
      }
    });
  },

  // Upload from URL
  uploadFromUrl: async (req, res) => {
    try {
      const { url, provider, category, language, country, tags } = req.body;
      
      if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required' });
      }
      
      const channels = await m3uParser.parseFromUrl(url, provider || 'Unknown Provider');
      
      // Save channels to database
      let savedCount = 0;
      for (const channel of channels) {
        // Check if channel already exists with same URL
        const existingChannel = await Channel.findOne({ url: channel.url });
        if (!existingChannel) {
          const newChannel = new Channel({
            ...channel,
            category: category || 'Uncategorized',
            channelLanguage: language || 'Unknown',
            country: country || 'Unknown',
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
          });
          await newChannel.save();
          savedCount++;
        }
      }
      
      res.status(200).json({ 
        success: true, 
        message: `URL processed successfully. Added ${savedCount} new channels.` 
      });
    } catch (error) {
      console.error('Error processing URL:', error);
      res.status(500).json({ success: false, message: 'Error processing URL' });
    }
  },

  // Upload from credentials
  uploadFromCredentials: async (req, res) => {
    try {
      const { serverUrl, port, username, password, provider, category, language, country, tags } = req.body;
      
      if (!serverUrl || !username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Server URL, username, and password are required' 
        });
      }
      
      const channels = await m3uParser.parseFromCredentials(
        serverUrl, 
        port || '80', 
        username, 
        password, 
        provider || 'Unknown Provider'
      );
      
      // Save channels to database
      let savedCount = 0;
      for (const channel of channels) {
        // Check if channel already exists with same URL
        const existingChannel = await Channel.findOne({ url: channel.url });
        if (!existingChannel) {
          const newChannel = new Channel({
            ...channel,
            category: category || 'Uncategorized',
            channelLanguage: language || 'Unknown',
            country: country || 'Unknown',
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
          });
          await newChannel.save();
          savedCount++;
        }
      }
      
      res.status(200).json({ 
        success: true, 
        message: `Credentials processed successfully. Added ${savedCount} new channels.` 
      });
    } catch (error) {
      console.error('Error processing credentials:', error);
      res.status(500).json({ success: false, message: 'Error processing credentials' });
    }
  },

  // Check channel status
  checkChannelStatus: async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await statusChecker.checkSingleChannel(id);
      
      res.status(200).json({ 
        success: true, 
        data: result
      });
    } catch (error) {
      console.error('Error checking channel status:', error);
      res.status(500).json({ success: false, message: 'Error checking channel status' });
    }
  },

// Check all channels
checkAllChannels: async (req, res) => {
  // Set proper headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Use the actual origin from the request instead of wildcard
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Ensure the response is not buffered
  if (res.flush) {
    res.flush();
  }
  
  try {
    // Send an initial message to establish the connection
    res.write(`data: ${JSON.stringify({ message: "Connection established" })}\n\n`);
    if (res.flush) res.flush();
    
    // Set up progress callback
    statusChecker.setProgressCallback((progress) => {
      console.log('Progress update:', progress); // Log progress for debugging
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
      // Flush the data immediately
      if (res.flush) {
        res.flush();
      }
    });
    
    // Start the check process
    const result = await statusChecker.checkAllChannels();
    
    // Send final result
    res.write(`data: ${JSON.stringify({ ...result, done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error checking all channels:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
},


  // Check channels by category
  checkChannelsByCategory: async (req, res) => {
    // Set proper headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Ensure the response is not buffered
    if (res.flush) {
      res.flush();
    }
    
    try {
      const { category } = req.params;
      
      // Send an initial message to establish the connection
      res.write(`data: ${JSON.stringify({ message: "Connection established" })}\n\n`);
      if (res.flush) res.flush();
      
      // Set up progress callback
      statusChecker.setProgressCallback((progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
        // Flush the data immediately
        if (res.flush) {
          res.flush();
        }
      });
      
      // Start the check process
      const result = await statusChecker.checkChannelsByCategory(category);
      
      // Send final result
      res.write(`data: ${JSON.stringify({ ...result, done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error checking channels by category:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  },

  // Check selected channels
  checkChannelsByIds: async (req, res) => {
    // Create an SSE connection for progress updates
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Ensure the response is not buffered
    if (res.flush) {
      res.flush();
    }
    
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        res.write(`data: ${JSON.stringify({ error: 'Channel IDs are required' })}\n\n`);
        return res.end();
      }
      
      // Send an initial message to establish the connection
      res.write(`data: ${JSON.stringify({ message: "Connection established" })}\n\n`);
      if (res.flush) res.flush();
      
      // Set up progress callback
      statusChecker.setProgressCallback((progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
        // Flush the data immediately
        if (res.flush) {
          res.flush();
        }
      });
      
      // Start the check process
      const result = await statusChecker.checkChannelsByIds(ids);
      
      // Send final result
      res.write(`data: ${JSON.stringify({ ...result, done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error checking channels by IDs:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  },

  // New endpoint for starting a check with polling approach
  startCheckAllChannels: async (_req, res) => {
    try {
      // Generate a unique check ID
      const checkId = mongoose.Types.ObjectId().toString();
      
      // Store check info in memory or database
      global.channelChecks = global.channelChecks || {};
      global.channelChecks[checkId] = {
        status: 'started',
        progress: {
          percentage: 0,
          processed: 0,
          total: 0,
          live: 0
        },
        startTime: new Date()
      };
      
      // Set up progress callback
      statusChecker.setProgressCallback((progress) => {
        if (global.channelChecks[checkId]) {
          global.channelChecks[checkId].progress = progress;
        }
      });
      
      // Start the check process without awaiting it
      statusChecker.checkAllChannels()
        .then(result => {
          if (global.channelChecks[checkId]) {
            global.channelChecks[checkId].status = 'completed';
            global.channelChecks[checkId].progress = {
              ...global.channelChecks[checkId].progress,
              ...result,
              done: true
            };
          }
        })
        .catch(error => {
          console.error('Error checking all channels:', error);
          if (global.channelChecks[checkId]) {
            global.channelChecks[checkId].status = 'error';
            global.channelChecks[checkId].error = error.message;
          }
        });
      
      // Return the check ID to the client
      res.status(200).json({ 
        success: true, 
        message: 'Channel check started',
        checkId
      });
    } catch (error) {
      console.error('Error starting channel check:', error);
      res.status(500).json({ success: false, message: 'Error starting channel check' });
    }
  },

  // New endpoint for checking progress with polling approach
  getCheckProgress: async (req, res) => {
    try {
      const { checkId } = req.params;
      
      if (!global.channelChecks || !global.channelChecks[checkId]) {
        return res.status(404).json({ 
          success: false, 
          message: 'Check not found or expired' 
        });
      }
      
      const checkInfo = global.channelChecks[checkId];
      
      // If check is completed or errored, clean up after sending response
      if (checkInfo.status === 'completed' || checkInfo.status === 'error') {
        setTimeout(() => {
          if (global.channelChecks && global.channelChecks[checkId]) {
            delete global.channelChecks[checkId];
          }
        }, 60000); // Clean up after 1 minute
      }
      
      res.status(200).json({
        success: true,
        status: checkInfo.status,
        progress: checkInfo.progress,
        error: checkInfo.error,
        done: checkInfo.status === 'completed'
      });
    } catch (error) {
      console.error('Error getting check progress:', error);
      res.status(500).json({ success: false, message: 'Error getting check progress' });
    }
  },

  // Cleanup inactive channels
  cleanupInactiveChannels: async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days) : 4;
      
      const deletedCount = await statusChecker.cleanupInactiveChannels(days);
      
      res.status(200).json({ 
        success: true, 
        message: `Deleted ${deletedCount} channels that haven't been live in ${days} days.` 
      });
    } catch (error) {
      console.error('Error cleaning up inactive channels:', error);
      res.status(500).json({ success: false, message: 'Error cleaning up inactive channels' });
    }
  },

  // Update channel
  updateChannel: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        name, 
        url, 
        provider, 
        format, 
        category, 
        language, 
        country, 
        tags,
        description,
        logo,
        epgId
      } = req.body;
      
      const channel = await Channel.findById(id);
      if (!channel) {
        return res.status(404).json({ success: false, message: 'Channel not found' });
      }
      
      // Update fields
      if (name) channel.name = name;
      if (url) channel.url = url;
      if (provider) channel.provider = provider;
      if (format) channel.format = format;
      if (category) channel.category = category;
      if (language) channel.channelLanguage = language;
      if (country) channel.country = country;
      if (tags) channel.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
      if (description) channel.description = description;
      if (logo) channel.logo = logo;
      if (epgId) channel.epgId = epgId;
      
      channel.updatedAt = new Date();
      
      await channel.save();
      
      res.status(200).json({ success: true, data: channel });
    } catch (error) {
      console.error('Error updating channel:', error);
      res.status(500).json({ success: false, message: 'Error updating channel' });
    }
  },

  // Delete channel
  deleteChannel: async (req, res) => {
    try {
      const { id } = req.params;
      
      const channel = await Channel.findByIdAndDelete(id);
      if (!channel) {
        return res.status(404).json({ success: false, message: 'Channel not found' });
      }
      
      // Delete channel check history
      await ChannelCheckHistory.deleteMany({ channel: id });
      
      res.status(200).json({ success: true, message: 'Channel deleted successfully' });
    } catch (error) {
      console.error('Error deleting channel:', error);
      res.status(500).json({ success: false, message: 'Error deleting channel' });
    }
  },

  // Bulk delete channels
  bulkDeleteChannels: async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Channel IDs are required' });
      }
      
      // Delete channels
      const result = await Channel.deleteMany({ _id: { $in: ids } });
      
      // Delete channel check history
      await ChannelCheckHistory.deleteMany({ channel: { $in: ids } });
      
      res.status(200).json({ 
        success: true, 
        message: `${result.deletedCount} channels deleted successfully` 
      });
    } catch (error) {
      console.error('Error deleting channels:', error);
      res.status(500).json({ success: false, message: 'Error deleting channels' });
    }
  },

  // Bulk update channels
  bulkUpdateChannels: async (req, res) => {
    try {
      const { ids, updates } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Channel IDs are required' });
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'Updates are required' });
      }
      
      // Prepare update object
      const updateObj = {};
      
      // Only allow specific fields to be updated in bulk
      const allowedFields = ['category', 'channelLanguage', 'country', 'tags', 'provider'];
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateObj[field] = updates[field];
        }
      }
      
      // Add updatedAt field
      updateObj.updatedAt = new Date();
      
      // Update channels
      const result = await Channel.updateMany(
        { _id: { $in: ids } },
        { $set: updateObj }
      );
      
      res.status(200).json({ 
        success: true, 
        message: `${result.modifiedCount} channels updated successfully` 
      });
    } catch (error) {
      console.error('Error updating channels:', error);
      res.status(500).json({ success: false, message: 'Error updating channels' });
    }
  }
};

/**
 * Get live channel count
 */
channelController.getLiveCount = async (_req, res) => {
  try {
    const count = await Channel.countDocuments({ isLive: true });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error getting live channel count:', error);
    res.status(500).json({ success: false, message: 'Error getting live channel count' });
  }
};

module.exports = channelController;
