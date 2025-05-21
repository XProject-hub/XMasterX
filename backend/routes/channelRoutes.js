const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/search', channelController.searchChannels);
router.get('/categories', channelController.getCategories);
router.get('/providers', channelController.getProviders);
router.get('/languages', channelController.getLanguages);
router.get('/countries', channelController.getCountries);
router.get('/tags', channelController.getTags);
router.get('/system/statistics', protect, admin, channelController.getSystemStatistics);

// Protected routes (require authentication)
router.get('/', protect, channelController.getAllChannels);
router.get('/:id', protect, channelController.getChannelById);
router.get('/:id/statistics', protect, channelController.getChannelStatistics);
router.post('/start-check', protect, admin, channelController.startCheckAllChannels);
router.get('/check-progress/:checkId', protect, admin, channelController.getCheckProgress);

// Admin routes
router.post('/upload', protect, admin, channelController.uploadFile);
router.post('/upload-url', protect, admin, channelController.uploadFromUrl);
router.post('/upload-credentials', protect, admin, channelController.uploadFromCredentials);
router.put('/:id', protect, admin, channelController.updateChannel);
router.delete('/:id', protect, admin, channelController.deleteChannel);
router.post('/:id/check-status', protect, admin, channelController.checkChannelStatus);
router.post('/check-all', protect, admin, channelController.checkAllChannels);
router.post('/check-category/:category', protect, admin, channelController.checkChannelsByCategory);
router.post('/check-selected', protect, admin, channelController.checkChannelsByIds);
router.post('/cleanup', protect, admin, channelController.cleanupInactiveChannels);
router.post('/bulk-delete', protect, admin, channelController.bulkDeleteChannels);
router.post('/bulk-update', protect, admin, channelController.bulkUpdateChannels);

module.exports = router;
