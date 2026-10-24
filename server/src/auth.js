
const { betterAuth } = require('better-auth');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');
const mongoose = require('mongoose');

/**
 * Better Auth instance configured with MongoDB via the existing Mongoose connection.
 * The `mongodbAdapter` wraps the native MongoDB driver that Mongoose exposes.
 *
 * IMPORTANT: This module is imported *after* `connectDB()` is called so that
 * `mongoose.connection.db` is already available.
 */

const auth = betterAuth({
  // Use the Mongoose native MongoDB client
  database: mongodbAdapter(mongoose.connection.db),

  // Allow requests from the React frontend
  trustedOrigins: [
    process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  ],

  // Email + password sign-in
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // Additional fields stored on the user document
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'student',
        required: false,
      },
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7,        // 7 days
    updateAge: 60 * 60 * 24,             // refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,                    // 5-minute client-side cache
    },
  },
});

module.exports = { auth };
