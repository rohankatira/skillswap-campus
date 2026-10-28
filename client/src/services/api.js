
import { getStoredAuthToken, resolveBaseUrl } from '../lib/authClient';

/**
 * Base URL for Express REST API (/api/students, /api/requests, etc.).
 * When deployed on Vercel, requests to /api are proxied to the backend server via client/vercel.json.
 */
export async function apiRequest(path, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = resolveBaseUrl();
  const apiBaseUrl = baseUrl ? `${baseUrl}/api` : '/api';
  const token = getStoredAuthToken();

  const response = await fetch(`${apiBaseUrl}${normalizedPath}`, {
    ...options,
    // Include credentials so Better Auth session cookies are sent on every request
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null
        ? data.message || data.error
        : data;

    throw new Error(
      message || `Request failed with status ${response.status}`
    );
  }

  return data;
}
