const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// User profile routes
router.get('/profile', userProfileController.getUserProfile);
router.put('/preferences', userProfileController.updatePreferences);

// Favorites routes
router.get('/favorites', userProfileController.getFavorites);
router.post('/favorites', userProfileController.addFavorite);
router.delete('/favorites/:channelId', userProfileController.removeFavorite);

// Watch history routes
router.get('/watch-history', userProfileController.getWatchHistory);
router.post('/watch-history', userProfileController.addToWatchHistory);
router.delete('/watch-history', userProfileController.clearWatchHistory);

module.exports = router;
