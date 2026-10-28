
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

function extractSessionToken(setCookieHeader) {
  if (!setCookieHeader) return null;
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const c of cookies) {
    if (!c) continue;
    const match = c.match(/(?:^|;\s*)[^;=]*session_token=([^;]+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

module.exports = async (req, res, next) => {
  try {
    const handler = await getAuthHandler();

    // If this is an OAuth callback redirect, append the session token to the redirect URL
    // so cross-origin frontends receive the Bearer token immediately
    if (req.url && req.url.includes('/callback/')) {
      const origWriteHead = res.writeHead.bind(res);
      res.writeHead = function (statusCode, statusMessage, headers) {
        let actualHeaders = headers;
        if (typeof statusMessage === 'object' && statusMessage !== null) {
          actualHeaders = statusMessage;
        }

        const location =
          res.getHeader('location') ||
          (actualHeaders && (actualHeaders.Location || actualHeaders.location));
        const setCookie = res.getHeader('set-cookie');

        if ((statusCode === 302 || statusCode === 307) && location && setCookie) {
          const token = extractSessionToken(setCookie);
          if (token) {
            try {
              const url = new URL(location);
              url.searchParams.set('token', token);
              const newLocation = url.toString();
              res.setHeader('location', newLocation);
              if (actualHeaders) {
                if (actualHeaders.Location) actualHeaders.Location = newLocation;
                if (actualHeaders.location) actualHeaders.location = newLocation;
              }
            } catch {
              const separator = location.includes('?') ? '&' : '?';
              const newLocation = `${location}${separator}token=${encodeURIComponent(token)}`;
              res.setHeader('location', newLocation);
              if (actualHeaders) {
                if (actualHeaders.Location) actualHeaders.Location = newLocation;
                if (actualHeaders.location) actualHeaders.location = newLocation;
              }
            }
          }
        }

        return origWriteHead(statusCode, statusMessage, headers);
      };
    }

    return handler(req, res);
  } catch (error) {
    next(error);
  }
};
