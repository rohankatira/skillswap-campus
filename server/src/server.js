
require('dotenv').config();

const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to MongoDB before setting up the app
    // This is critical: Better Auth's MongoDB adapter needs mongoose.connection.db
    // to be available when auth.js is first used.
    await connectDB();

    // Require app AFTER DB connects so mongoose.connection.db is ready for Better Auth
    const app = require('./app');

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Auth endpoint: http://localhost:${PORT}/api/auth`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

startServer();
