const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/chat', chatController.handleChat);
router.post('/validate-leetcode', chatController.validateLeetCodeUrl);
router.get('/chat/:sessionId', chatController.getChatHistory);

module.exports = router;