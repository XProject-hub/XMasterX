const mongoose = require('mongoose');

const ChannelCheckHistorySchema = new mongoose.Schema({
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true
  },
  isLive: {
    type: Boolean,
    required: true
  },
  checkedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  responseTime: {
    type: Number, // in milliseconds
    default: 0
  },
  statusCode: {
    type: Number,
    default: null
  },
  error: {
    type: String,
    default: null
  }
});

// Index for efficient querying
ChannelCheckHistorySchema.index({ channel: 1, checkedAt: -1 });

// Static method to get uptime percentage for a channel
ChannelCheckHistorySchema.statics.getUptimePercentage = async function(channelId, days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const checks = await this.find({
    channel: channelId,
    checkedAt: { $gte: cutoffDate }
  });
  
  if (checks.length === 0) {
    return 0;
  }
  
  const liveChecks = checks.filter(check => check.isLive).length;
  return (liveChecks / checks.length) * 100;
};

// Static method to get check history for a channel
ChannelCheckHistorySchema.statics.getChannelHistory = async function(channelId, limit = 100) {
  return this.find({ channel: channelId })
    .sort({ checkedAt: -1 })
    .limit(limit);
};

// Static method to get overall system statistics
ChannelCheckHistorySchema.statics.getSystemStats = async function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        checkedAt: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$checkedAt" } },
          isLive: "$isLive"
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: "$responseTime" }
      }
    },
    {
      $sort: { "_id.day": 1 }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('ChannelCheckHistory', ChannelCheckHistorySchema);
