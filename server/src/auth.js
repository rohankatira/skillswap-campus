const mongoose = require('mongoose');
const { sendOtpEmail } = require('./services/emailService');

let authInstance = null;

/**
 * Lazily loads and initializes Better Auth via dynamic import().
 * This prevents ERR_REQUIRE_ESM errors when running CommonJS in Vercel/Node.js.
 */
async function getAuth() {
  if (authInstance) {
    return authInstance;
  }

  const [{ betterAuth }, { mongodbAdapter }, { emailOTP }] = await Promise.all([
    import('better-auth'),
    import('better-auth/adapters/mongodb'),
    import('better-auth/plugins'),
  ]);

  let baseURL = process.env.BETTER_AUTH_URL;
  if (!baseURL || (process.env.VERCEL && baseURL.includes('localhost'))) {
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      baseURL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else if (process.env.VERCEL_URL) {
      baseURL = `https://${process.env.VERCEL_URL}`;
    } else {
      baseURL = 'https://skillswap-campus-rohan-katiras-projects.vercel.app';
    }
  }
  baseURL = (baseURL || 'http://localhost:5000').trim().replace(/\/$/, '');
  process.env.BETTER_AUTH_URL = baseURL;

  authInstance = betterAuth({
    // Use the Mongoose native MongoDB client
    database: mongodbAdapter(mongoose.connection.db),

    // Server base URL
    baseURL,

    // Cookie configuration for cross-origin frontend-backend deployments on Vercel
    advanced: {
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
      },
    },

    // Allow requests from the React frontend (local, Vercel, and Render deployments)
    trustedOrigins: Array.from(
      new Set([
        (process.env.CLIENT_ORIGIN || 'http://localhost:5173').trim().replace(/\/$/, ''),
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'https://skillswap-client.onrender.com',
        'https://*.vercel.app',
        '*.vercel.app',
        'https://*.onrender.com',
        '*.onrender.com',
        'https://client-mu-dun-74.vercel.app',
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
      updateAge: 60 * 60 * 24,             // refresh if older day
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
  });

  return authInstance;
}

module.exports = { getAuth };
