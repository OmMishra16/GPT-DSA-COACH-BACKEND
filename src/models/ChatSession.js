const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system', 'tool'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  tool_call_id: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  leetcodeUrl: {
    type: String,
    required: true,
    default: 'pending'
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  problemDetails: {
    type: Object,
    required: false
  }
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);