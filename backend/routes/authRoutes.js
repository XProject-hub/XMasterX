const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/create-admin', authController.createAdmin);

// Protected routes
router.get('/me', protect, authController.getCurrentUser);

module.exports = router;
