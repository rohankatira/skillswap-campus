
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

function resolveTargetLocation(location, clientOrigin) {
  if (!location) return clientOrigin;
  // If location is relative (e.g. '/' or '/profile?welcome=1')
  if (location.startsWith('/')) {
    return `${clientOrigin}${location}`;
  }
  try {
    const parsed = new URL(location);
    const targetOrigin = new URL(clientOrigin);
    // If the redirect points to backend or localhost in production, redirect to frontend client origin
    if (
      process.env.VERCEL &&
      (parsed.hostname.includes('localhost') ||
        parsed.hostname.includes('skillswap-campus') ||
        parsed.hostname.includes('onrender.com'))
    ) {
      parsed.protocol = targetOrigin.protocol;
      parsed.hostname = targetOrigin.hostname;
      parsed.port = targetOrigin.port;
      return parsed.toString();
    }
    return location;
  } catch {
    return `${clientOrigin}/${location.replace(/^\/+/, '')}`;
  }
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
            const clientOrigin = (
              process.env.CLIENT_ORIGIN ||
              (process.env.VERCEL ? 'https://client-mu-dun-74.vercel.app' : 'http://localhost:5173')
            ).trim().replace(/\/$/, '');

            const targetUrl = resolveTargetLocation(location, clientOrigin);
            let newLocation;
            try {
              const url = new URL(targetUrl);
              url.searchParams.set('token', token);
              newLocation = url.toString();
            } catch {
              const separator = targetUrl.includes('?') ? '&' : '?';
              newLocation = `${targetUrl}${separator}token=${encodeURIComponent(token)}`;
            }

            res.setHeader('location', newLocation);
            if (actualHeaders) {
              if (actualHeaders.Location) actualHeaders.Location = newLocation;
              if (actualHeaders.location) actualHeaders.location = newLocation;
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
