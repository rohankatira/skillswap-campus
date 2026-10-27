
const express = require('express');
const cors = require('cors');

const studentRoutes = require('./routes/students');
const requestRoutes = require('./routes/requests');
const chatRoutes = require('./routes/chat');
const meetingRoutes = require('./routes/meetings');
const authHandler = require('./routes/authRoutes');

const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Allow requests from your React frontend
// credentials: true is required for Better Auth cookie-based sessions
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Mount Better Auth BEFORE express.json() — it handles its own body parsing
app.all('/api/auth/*splat', authHandler);

// Parse incoming JSON requests (for all other routes)
app.use(express.json());

// Root route: redirect browser visits on the backend port directly to the React frontend
app.get('/', (req, res) => {
  res.redirect(process.env.CLIENT_ORIGIN || 'http://localhost:5173');
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillSwap Campus API is running',
  });
});

// API routes
app.use('/api/students', studentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/meetings', meetingRoutes);

// Handle unknown routes
app.use(notFoundMiddleware);

// Handle application errors
app.use(errorMiddleware);

module.exports = app;
