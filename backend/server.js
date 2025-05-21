const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');
const statusChecker = require('./utils/statusChecker');
const path = require('path');
require('dotenv').config();

// Create Express app
const app = express();

// Import routes
const channelRoutes = require('./routes/channelRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Connect to database
connectDB();

// Improved CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, or same-origin requests)
    if(!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://collection.onthewifi.com',
      'https://collection.onthewifi.com',
      'http://collection.onthewifi.com:3000',
      'http://collection.onthewifi.com:5000',
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    if(allowedOrigins.indexOf(origin) === -1){
      console.log('Blocked origin:', origin);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    console.log('Allowed origin:', origin);
    return callback(null, origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Detailed error logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Routes
app.use('/api/channels', channelRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Schedule status check every 12 hours
cron.schedule('0 */12 * * *', async () => {
  console.log('Running scheduled status check...');
  try {
    await statusChecker.checkAllChannels();
    console.log('Scheduled status check completed');
  } catch (error) {
    console.error('Error in scheduled status check:', error);
  }
});

// Schedule cleanup of inactive channels every 4 days
cron.schedule('0 0 */4 * *', async () => {
  console.log('Running scheduled cleanup of inactive channels...');
  try {
    await statusChecker.cleanupInactiveChannels(4);
    console.log('Scheduled cleanup completed');
  } catch (error) {
    console.error('Error in scheduled cleanup:', error);
  }
});

// Schedule uptime statistics update daily
cron.schedule('0 0 * * *', async () => {
  console.log('Running scheduled uptime statistics update...');
  try {
    await statusChecker.updateChannelUptimeStats();
    console.log('Scheduled uptime statistics update completed');
  } catch (error) {
    console.error('Error in scheduled uptime statistics update:', error);
  }
});

// Detailed error logging
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next(err);
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// Final error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Server error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Press Ctrl+C to stop the server');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise);
  console.error('Reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // It's best practice to exit on uncaught exceptions
  // process.exit(1);
});

module.exports = app;
