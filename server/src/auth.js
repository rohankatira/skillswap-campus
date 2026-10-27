
const { betterAuth } = require('better-auth');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');
const { emailOTP } = require('better-auth/plugins');
const mongoose = require('mongoose');
const { sendOtpEmail } = require('./services/emailService');

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

  // Server base URL
  baseURL: (process.env.BETTER_AUTH_URL || 'http://localhost:5000').trim().replace(/\/$/, ''),

  // Allow requests from the React frontend
  trustedOrigins: Array.from(
    new Set([
      (process.env.CLIENT_ORIGIN || 'http://localhost:5173').trim().replace(/\/$/, ''),
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'https://skillswap-client.onrender.com',
    ])
  ),

  // Email + password sign-in with mandatory OTP email verification
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  // Auto sign in when email verification succeeds
  emailVerification: {
    autoSignInAfterVerification: true,
  },

  // Skip browser state cookie check across localhost ports (verifies state securely via database instead)
  account: {
    skipStateCookieCheck: true,
  },

  // In case of an auth error, redirect back to the React app instead of backend 404
  onAPIError: {
    errorURL: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/sign-in`,
  },

  // Social Auth Providers: Google & Facebook
  // When credentials are provided in .env, they are activated automatically.
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      enabled: !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
    },
  },

  // Email OTP Plugin for verification during sign up and login
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }, ctx) {
        await sendOtpEmail({ email, otp, type });
      },
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      expiresIn: 300, // 5 minutes
      otpLength: 6,
    }),
  ],

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

