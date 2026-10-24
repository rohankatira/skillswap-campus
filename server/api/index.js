/**
 * Vercel Serverless Entry Point
 *
 * Vercel Node.js functions must export a handler function.
 * We lazily connect to MongoDB and then lazily require the Express app so that
 * mongoose.connection.db is already open when auth.js imports the MongoDB adapter.
 *
 * On warm invocations the DB connection is reused (mongoose caches it).
 */

'use strict';

// Load .env in local preview (vercel dev). In production env vars come from the dashboard.
require('dotenv').config();

const connectDB = require('../src/config/db');

let app = null; // cached across warm invocations

async function getApp() {
  // Connect first — auth.js needs mongoose.connection.db at import time
  await connectDB();

  // Require AFTER connection is open
  if (!app) {
    app = require('../src/app');
  }

  return app;
}

module.exports = async (req, res) => {
  try {
    const handler = await getApp();
    return handler(req, res);
  } catch (error) {
    console.error('[Vercel] Failed to initialise app:', error.message);
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again.',
    });
  }
};
