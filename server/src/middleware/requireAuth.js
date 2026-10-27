
/**
 * Converts Node.js HTTP incoming request headers into Web Standard Headers
 * without requiring ESM modules that fail in CommonJS runtimes.
 */
function fromNodeHeaders(nodeHeaders) {
  const webHeaders = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => webHeaders.append(key, v));
      } else {
        webHeaders.set(key, value);
      }
    }
  }
  return webHeaders;
}
const { getAuth } = require('../auth');
const Student = require('../models/Student');

/**
 * Reads the Better Auth session from the request cookies.
 * Sets `req.user` (the Better Auth user) or responds 401.
 */
async function requireAuth(req, res, next) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({
        success: false,
        message: 'Please sign in to continue',
      });
    }

    req.user = session.user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Must run after `requireAuth`.
 * Loads the logged-in user's Student profile into `req.student`,
 * or responds 403 if they haven't created a profile yet.
 */
async function requireStudentProfile(req, res, next) {
  try {
    const student = await Student.findOne({ userId: req.user.id });

    if (!student) {
      return res.status(403).json({
        success: false,
        code: 'PROFILE_REQUIRED',
        message: 'Please complete your student profile first',
      });
    }

    req.student = student;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireAuth, requireStudentProfile };
