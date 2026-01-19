// Load environment variables first, before any other imports
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');

// Import controllers
const chatController = require('./controllers/chatController');
const problemController = require('./controllers/problemController');

// Initialize express app
const app = express();

const corsOptions = {
  origin: ['https://gpt-dsa-coach.vercel.app', 'http://localhost:3000', "*"],
  methods: ['GET', 'POST'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Create a single API router
const apiRouter = express.Router();

// Chat routes
apiRouter.post('/chat', chatController.handleChat);
apiRouter.post('/chat/validate-url', chatController.validateLeetCodeUrl);
apiRouter.get('/chat/:sessionId', chatController.getChatHistory);

// Problem routes - Note: specific route before general route
apiRouter.get('/problems/validate/:titleSlug', problemController.validateProblem);
apiRouter.get('/problems/:titleSlug', problemController.getProblemDetails);

// Health check route
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Mount the API router
app.use('/api', apiRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa-coach';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Continuing without database connection...');
});

// Start server only if not in test mode
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;