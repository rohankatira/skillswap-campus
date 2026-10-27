
let authHandler = null;

async function getAuthHandler() {
  if (!authHandler) {
    const { toNodeHandler } = await import('better-auth/node');
    const { getAuth } = require('../auth');
    const auth = await getAuth();
    authHandler = toNodeHandler(auth);
  }
  return authHandler;
}

module.exports = async (req, res, next) => {
  try {
    const handler = await getAuthHandler();
    return handler(req, res);
  } catch (error) {
    next(error);
  }
};
