const axios = require('axios');
const Channel = require('../models/Channel');
const ChannelCheckHistory = require('../models/ChannelCheckHistory');

class StatusChecker {
  constructor() {
    this.timeout = 3000; // 3 seconds timeout for checking
    this.concurrentChecks = 20; // Number of concurrent checks
    this.progressCallback = null; // For progress tracking
    this.progressUpdateFrequency = 10; // Update progress every X channels
  }

  // Set a progress callback
  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  async checkChannelStatus(url) {
    const startTime = Date.now();
    let isLive = false;
    let statusCode = null;
    let error = null;
    
    try {
      const response = await axios.head(url, {
        timeout: this.timeout,
        validateStatus: function (status) {
          return status < 500; // Accept all status codes less than 500
        }
      });
      
      statusCode = response.status;
      isLive = response.status >= 200 && response.status < 400;
    } catch (err) {
      error = err.message;
      isLive = false;
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      isLive,
      responseTime,
      statusCode,
      error
    };
  }

  async checkSingleChannel(channelId) {
    try {
      const channel = await Channel.findById(channelId);
      
      if (!channel) {
        throw new Error('Channel not found');
      }
      
      const result = await this.checkChannelStatus(channel.url);
      
      // Update channel status
      channel.isLive = result.isLive;
      channel.lastChecked = new Date();
      
      if (result.isLive) {
        channel.lastLive = new Date();
      }
      
      await channel.save();
      
      // Record check history
      await ChannelCheckHistory.create({
        channel: channel._id,
        isLive: result.isLive,
        checkedAt: new Date(),
        responseTime: result.responseTime,
        statusCode: result.statusCode,
        error: result.error
      });
      
      return {
        channelId: channel._id,
        name: channel.name,
        isLive: result.isLive,
        lastChecked: channel.lastChecked,
        responseTime: result.responseTime
      };
    } catch (error) {
      console.error(`Error checking channel ${channelId}:`, error);
      throw error;
    }
  }

  async checkAllChannels() {
    try {
      const channels = await Channel.find({});
      console.log(`Starting status check for ${channels.length} channels`);
      
      let liveCount = 0;
      let results = [];
      let processedCount = 0; // Track processed channels
      const totalCount = channels.length; // Total number of channels
      
      // Send initial progress update
      if (this.progressCallback) {
        const initialProgress = {
          processed: 0,
          total: totalCount,
          percentage: 0,
          live: 0
        };
        console.log('Sending initial progress update:', initialProgress);
        this.progressCallback(initialProgress);
      }
      
      // Process channels in batches to avoid overwhelming the system
      for (let i = 0; i < channels.length; i += this.concurrentChecks) {
        const batch = channels.slice(i, i + this.concurrentChecks);
        console.log(`Processing batch ${Math.floor(i/this.concurrentChecks) + 1} of ${Math.ceil(channels.length/this.concurrentChecks)}`);
        
        // Process batch concurrently
        const batchPromises = batch.map(async (channel) => {
          try {
            const result = await this.checkChannelStatus(channel.url);
            
            // Update channel status
            channel.isLive = result.isLive;
            channel.lastChecked = new Date();
            
            if (result.isLive) {
              channel.lastLive = new Date();
              liveCount++;
            }
            
            await channel.save();
            
            // Record check history
            await ChannelCheckHistory.create({
              channel: channel._id,
              isLive: result.isLive,
              checkedAt: new Date(),
              responseTime: result.responseTime,
              statusCode: result.statusCode,
              error: result.error
            });
            
            return {
              channelId: channel._id,
              name: channel.name,
              isLive: result.isLive
            };
          } catch (error) {
            console.error(`Error checking channel ${channel._id}:`, error);
            return {
              channelId: channel._id,
              name: channel.name,
              error: error.message
            };
          } finally {
            // Update progress after each channel is processed
            processedCount++;
            
            // Send progress updates at regular intervals to avoid flooding
            if (this.progressCallback && (processedCount % this.progressUpdateFrequency === 0 || processedCount === totalCount)) {
              const progress = {
                processed: processedCount,
                total: totalCount,
                percentage: Math.round((processedCount / totalCount) * 100),
                live: liveCount
              };
              console.log(`Progress update: ${progress.processed}/${progress.total} (${progress.percentage}%) - Live: ${progress.live}`);
              this.progressCallback(progress);
            }
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results = [...results, ...batchResults];
        
        // Send batch completion update
        if (this.progressCallback) {
          const batchProgress = {
            processed: processedCount,
            total: totalCount,
            percentage: Math.round((processedCount / totalCount) * 100),
            live: liveCount,
            batchComplete: true
          };
          console.log(`Batch complete: ${batchProgress.processed}/${batchProgress.total} (${batchProgress.percentage}%) - Live: ${batchProgress.live}`);
          this.progressCallback(batchProgress);
        }
        
        // Small delay between batches to prevent rate limiting
        if (i + this.concurrentChecks < channels.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`Status check completed. ${liveCount} channels are live.`);
      
      // Update channel uptime statistics
      await this.updateChannelUptimeStats();
      
      // Send final progress update
      if (this.progressCallback) {
        const finalProgress = {
          processed: totalCount,
          total: totalCount,
          percentage: 100,
          live: liveCount,
          done: true
        };
        console.log('Sending final progress update:', finalProgress);
        this.progressCallback(finalProgress);
      }
      
      return { 
        total: channels.length, 
        live: liveCount,
        results
      };
    } catch (error) {
      console.error('Error checking channel statuses:', error);
      
      // Send error progress update
      if (this.progressCallback) {
        this.progressCallback({
          error: error.message,
          done: true
        });
      }
      
      throw error;
    }
  }

  async checkChannelsByCategory(category) {
    try {
      const channels = await Channel.find({ category });
      console.log(`Starting status check for ${channels.length} channels in category "${category}"`);
      
      let liveCount = 0;
      let results = [];
      let processedCount = 0; // Track processed channels
      const totalCount = channels.length; // Total number of channels
      
      // Send initial progress update
      if (this.progressCallback) {
        this.progressCallback({
          processed: 0,
          total: totalCount,
          percentage: 0,
          live: 0,
          category
        });
      }
      
      // Process channels in batches
      for (let i = 0; i < channels.length; i += this.concurrentChecks) {
        const batch = channels.slice(i, i + this.concurrentChecks);
        
        // Process batch concurrently
        const batchPromises = batch.map(async (channel) => {
          try {
            const result = await this.checkChannelStatus(channel.url);
            
            // Update channel status
            channel.isLive = result.isLive;
            channel.lastChecked = new Date();
            
            if (result.isLive) {
              channel.lastLive = new Date();
              liveCount++;
            }
            
            await channel.save();
            
            // Record check history
            await ChannelCheckHistory.create({
              channel: channel._id,
              isLive: result.isLive,
              checkedAt: new Date(),
              responseTime: result.responseTime,
              statusCode: result.statusCode,
              error: result.error
            });
            
            return {
              channelId: channel._id,
              name: channel.name,
              isLive: result.isLive
            };
          } catch (error) {
            console.error(`Error checking channel ${channel._id}:`, error);
            return {
              channelId: channel._id,
              name: channel.name,
              error: error.message
            };
          } finally {
            // Update progress after each channel is processed
            processedCount++;
            
            // Send progress updates at regular intervals
            if (this.progressCallback && (processedCount % this.progressUpdateFrequency === 0 || processedCount === totalCount)) {
              const progress = {
                processed: processedCount,
                total: totalCount,
                percentage: Math.round((processedCount / totalCount) * 100),
                live: liveCount,
                category
              };
              this.progressCallback(progress);
            }
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results = [...results, ...batchResults];
        
        // Small delay between batches
        if (i + this.concurrentChecks < channels.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`Status check for category "${category}" completed. ${liveCount} channels are live.`);
      
      // Send final progress update
      if (this.progressCallback) {
        this.progressCallback({
          processed: totalCount,
          total: totalCount,
          percentage: 100,
          live: liveCount,
          category,
          done: true
        });
      }
      
      return { 
        category,
        total: channels.length, 
        live: liveCount,
        results
      };
    } catch (error) {
      console.error(`Error checking channels in category "${category}":`, error);
      
      // Send error progress update
      if (this.progressCallback) {
        this.progressCallback({
          error: error.message,
          category,
          done: true
        });
      }
      
      throw error;
    }
  }

  async checkChannelsByIds(channelIds) {
    try {
      if (!Array.isArray(channelIds) || channelIds.length === 0) {
        throw new Error('Invalid channel IDs');
      }
      
      const channels = await Channel.find({ _id: { $in: channelIds } });
      console.log(`Starting status check for ${channels.length} selected channels`);
      
      let liveCount = 0;
      let results = [];
      let processedCount = 0; // Track processed channels
      const totalCount = channels.length; // Total number of channels
      
      // Send initial progress update
      if (this.progressCallback) {
        this.progressCallback({
          processed: 0,
          total: totalCount,
          percentage: 0,
          live: 0
        });
      }
      
      // Process channels in batches
      for (let i = 0; i < channels.length; i += this.concurrentChecks) {
        const batch = channels.slice(i, i + this.concurrentChecks);
        
        // Process batch concurrently
        const batchPromises = batch.map(async (channel) => {
          try {
            const result = await this.checkChannelStatus(channel.url);
            
            // Update channel status
            channel.isLive = result.isLive;
            channel.lastChecked = new Date();
            
            if (result.isLive) {
              channel.lastLive = new Date();
              liveCount++;
            }
            
            await channel.save();
            
            // Record check history
            await ChannelCheckHistory.create({
              channel: channel._id,
              isLive: result.isLive,
              checkedAt: new Date(),
              responseTime: result.responseTime,
              statusCode: result.statusCode,
              error: result.error
            });
            
            return {
              channelId: channel._id,
              name: channel.name,
              isLive: result.isLive
            };
          } catch (error) {
            console.error(`Error checking channel ${channel._id}:`, error);
            return {
              channelId: channel._id,
              name: channel.name,
              error: error.message
            };
          } finally {
            // Update progress after each channel is processed
            processedCount++;
            
            // Send progress updates at regular intervals
            if (this.progressCallback && (processedCount % this.progressUpdateFrequency === 0 || processedCount === totalCount)) {
              const progress = {
                processed: processedCount,
                total: totalCount,
                percentage: Math.round((processedCount / totalCount) * 100),
                live: liveCount
              };
              this.progressCallback(progress);
            }
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results = [...results, ...batchResults];
        
        // Small delay between batches
        if (i + this.concurrentChecks < channels.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`Status check for selected channels completed. ${liveCount} channels are live.`);
      
      // Send final progress update
      if (this.progressCallback) {
        this.progressCallback({
          processed: totalCount,
          total: totalCount,
          percentage: 100,
          live: liveCount,
          done: true
        });
      }
      
      return { 
        total: channels.length, 
        live: liveCount,
        results
      };
    } catch (error) {
      console.error('Error checking selected channels:', error);
      
      // Send error progress update
      if (this.progressCallback) {
        this.progressCallback({
          error: error.message,
          done: true
        });
      }
      
      throw error;
    }
  }

  async cleanupInactiveChannels(days = 4) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      // Find channels that haven't been live in the specified period
      const inactiveChannels = await Channel.find({
        $or: [
          { lastLive: { $lt: cutoffDate } },
          { lastLive: null, createdAt: { $lt: cutoffDate } }
        ]
      });
      
      console.log(`Found ${inactiveChannels.length} inactive channels`);
      
      // Delete the inactive channels
      const result = await Channel.deleteMany({
        $or: [
          { lastLive: { $lt: cutoffDate } },
          { lastLive: null, createdAt: { $lt: cutoffDate } }
        ]
      });
      
      // Also delete their check history
      if (inactiveChannels.length > 0) {
        const channelIds = inactiveChannels.map(channel => channel._id);
        await ChannelCheckHistory.deleteMany({ channel: { $in: channelIds } });
      }
      
      console.log(`Deleted ${result.deletedCount} inactive channels`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up inactive channels:', error);
      throw error;
    }
  }

  async updateChannelUptimeStats() {
    try {
      const channels = await Channel.find({});
      
      for (const channel of channels) {
        // Get check history for the last 7 days
        const history = await ChannelCheckHistory.find({
          channel: channel._id,
          checkedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });
        
        if (history.length > 0) {
          const liveChecks = history.filter(check => check.isLive).length;
          channel.uptime = (liveChecks / history.length) * 100;
          await channel.save();
        }
      }
      
      console.log('Channel uptime statistics updated');
    } catch (error) {
      console.error('Error updating channel uptime statistics:', error);
    }
  }

  async getChannelStatistics(channelId) {
    try {
      const channel = await Channel.findById(channelId);
      
      if (!channel) {
        throw new Error('Channel not found');
      }
      
      // Get check history for the last 7 days
      const history = await ChannelCheckHistory.find({
        channel: channelId,
        checkedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).sort({ checkedAt: -1 });
      
      // Calculate statistics
      const totalChecks = history.length;
      const liveChecks = history.filter(check => check.isLive).length;
      const uptime = totalChecks > 0 ? (liveChecks / totalChecks) * 100 : 0;
      
      // Calculate average response time
      const avgResponseTime = history.length > 0
        ? history.reduce((sum, check) => sum + check.responseTime, 0) / history.length
        : 0;
      
      // Group checks by day
      const dailyStats = {};
      history.forEach(check => {
        const day = check.checkedAt.toISOString().split('T')[0];
        if (!dailyStats[day]) {
          dailyStats[day] = { total: 0, live: 0 };
        }
        dailyStats[day].total++;
        if (check.isLive) {
          dailyStats[day].live++;
        }
      });
      
      // Convert to array for easier consumption by frontend
      const dailyStatsArray = Object.keys(dailyStats).map(day => ({
        date: day,
        total: dailyStats[day].total,
        live: dailyStats[day].live,
        uptime: (dailyStats[day].live / dailyStats[day].total) * 100
      }));
      
      return {
        channelId: channel._id,
        name: channel.name,
        provider: channel.provider,
        format: channel.format,
        isLive: channel.isLive,
        lastChecked: channel.lastChecked,
        lastLive: channel.lastLive,
        uptime,
        viewCount: channel.viewCount,
        favoriteCount: channel.favoriteCount,
        totalChecks,
        liveChecks,
        avgResponseTime,
        dailyStats: dailyStatsArray,
        recentChecks: history.slice(0, 10)
      };
    } catch (error) {
      console.error(`Error getting statistics for channel ${channelId}:`, error);
      throw error;
    }
  }
}

module.exports = new StatusChecker();
