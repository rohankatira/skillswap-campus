
const { toNodeHandler } = require('better-auth/node');
const { auth } = require('../auth');

/**
 * Express-compatible handler that mounts all Better Auth routes.
 *
 * Better Auth internally manages routes like:
 *   POST /api/auth/sign-up/email
 *   POST /api/auth/sign-in/email
 *   POST /api/auth/sign-out
 *   GET  /api/auth/session
 *   GET  /api/auth/get-session
 *
 * The `toNodeHandler` converts the Better Auth fetch-based handler into a
 * Node.js-compatible handler that Express can use with `app.all(...)`.
 */
const authHandler = toNodeHandler(auth);

module.exports = authHandler;
