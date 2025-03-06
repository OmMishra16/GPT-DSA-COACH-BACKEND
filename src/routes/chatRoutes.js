const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Route for handling chat messages
router.post('/', chatController.handleChat);

// Route for validating LeetCode URLs
router.post('/validate-url', chatController.validateLeetCodeUrl);

module.exports = router; 