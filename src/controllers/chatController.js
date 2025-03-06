const gptService = require('../services/gptService');
const leetcodeService = require('../services/leetcodeService');
let ChatSession;

try {
  ChatSession = require('../models/ChatSession');
} catch (error) {
  console.warn('ChatSession model not available, using in-memory storage');
  // In-memory fallback if MongoDB is not available
  class InMemoryChatSession {
    constructor(data) {
      Object.assign(this, data);
    }
    
    async save() {
      // No-op for in-memory
      return this;
    }
    
    static async findOne(query) {
      return chatSessions.get(query.sessionId) || null;
    }
  }
  
  ChatSession = InMemoryChatSession;
}

// In-memory storage for chat histories (as fallback)
const chatSessions = new Map();

const handleChat = async (req, res, next) => {
  try {
    const { message, leetcodeUrl, sessionId } = req.body;
    
    // Get or create chat session
    let chatSession;
    
    try {
      chatSession = await ChatSession.findOne({ sessionId });
    } catch (error) {
      console.warn('Error accessing database, using in-memory storage:', error.message);
      chatSession = chatSessions.get(sessionId);
    }
    
    if (!chatSession) {
      chatSession = new ChatSession({
        sessionId,
        leetcodeUrl: leetcodeUrl || 'pending',
        messages: [],
        problemDetails: null
      });
      
      // Store in memory as fallback
      chatSessions.set(sessionId, chatSession);
    }

    // If URL is provided in this request, update session and get problem details
    if (leetcodeUrl) {
      chatSession.leetcodeUrl = leetcodeUrl;
      try {
        const titleSlug = leetcodeUrl.split('/problems/')[1].split('/')[0];
        const details = await leetcodeService.getProblemDetails(titleSlug);
        if (details) {
          chatSession.problemDetails = details;
        }
      } catch (err) {
        console.error('Error parsing LeetCode URL:', err);
      }
    }

    // If no problem details yet, try to extract from message
    if (!chatSession.problemDetails) {
      // Check if message contains a LeetCode URL
      const urlMatch = message.match(/leetcode\.com\/problems\/([^\/\s?#]+)/);
      if (urlMatch) {
        const titleSlug = urlMatch[1];
        const details = await leetcodeService.getProblemDetails(titleSlug);
        if (details) {
          chatSession.problemDetails = details;
          chatSession.leetcodeUrl = `https://leetcode.com/problems/${titleSlug}`;
        }
      } else {
        // Try to extract problem name
        const words = message.toLowerCase().split(/\s+/);
        const searchTerm = words.slice(0, 3).join(' '); // Take first 3 words as potential problem name
        
        const searchResult = await leetcodeService.searchProblem(searchTerm);
        if (searchResult && searchResult.length > 0) {
          const details = await leetcodeService.getProblemDetails(searchResult[0].titleSlug);
          if (details) {
            chatSession.problemDetails = details;
            chatSession.leetcodeUrl = `https://leetcode.com/problems/${searchResult[0].titleSlug}`;
          }
        }
      }
    }

    // Generate response using problem details if available
    const response = await gptService.generateResponse(
      message, 
      chatSession.leetcodeUrl, 
      chatSession.messages,
      chatSession.problemDetails
    );
    
    // Update chat history
    chatSession.messages.push(
      { role: "user", content: message },
      { role: "assistant", content: response }
    );
    chatSession.updatedAt = Date.now();
    
    // Save to memory if database fails
    try {
      await chatSession.save();
    } catch (error) {
      console.warn('Error saving to database, using in-memory storage:', error.message);
      chatSessions.set(sessionId, chatSession);
    }
    
    res.json({ 
      success: true, 
      response,
      problemDetails: chatSession.problemDetails 
    });
  } catch (error) {
    console.error('Chat handler error:', error);
    next(error);
  }
};

const validateLeetCodeUrl = async (req, res, next) => {
  try {
    const { url } = req.body;
    const isValid = await leetcodeService.validateUrl(url);
    res.json({ success: true, isValid });
  } catch (error) {
    next(error);
  }
};

const getChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const chatSession = await ChatSession.findOne({ sessionId });
    
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      history: chatSession.messages,
      leetcodeUrl: chatSession.leetcodeUrl
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleChat,
  validateLeetCodeUrl,
  getChatHistory
};