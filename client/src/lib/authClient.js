
import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';

export const AUTH_TOKEN_KEY = 'better_auth_token';

export function getStoredAuthToken() {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem(AUTH_TOKEN_KEY) || undefined;
}

export function setStoredAuthToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

/**
 * Resolves the backend base URL.
 * In production on Vercel, requests to /api are proxied to the backend server via client/vercel.json.
 * This guarantees first-party cookie scoping, completely eliminating third-party cookie blocking
 * across Safari, Chrome, Firefox, and Brave.
 */
export function resolveBaseUrl() {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    // On production/Vercel:
    // If VITE_API_URL is empty, or points to the Vercel backend directly,
    // prefer same-origin (empty string) so Vercel rewrites proxy all /api calls.
    // This gives first-party cookies + seamless Bearer token fallback.
    if (!isLocalhost && (!envUrl || envUrl.includes('localhost') || envUrl.includes('vercel.app'))) {
      return '';
    }
  }

  return envUrl || 'http://localhost:5000';
}

export const authClient = createAuthClient({
  baseURL: resolveBaseUrl(),
  fetchOptions: {
    auth: {
      type: 'Bearer',
      token: () => getStoredAuthToken(),
    },
  },
  plugins: [
    emailOTPClient(),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession, emailOtp } = authClient;
