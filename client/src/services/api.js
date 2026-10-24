
// Base URL for the Express REST API (/api/students, /api/requests, etc.)
// VITE_API_URL points to the server root; we append /api for REST routes.
const SERVER_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

const API_BASE_URL = `${SERVER_URL}/api`;

export async function apiRequest(path, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...options,
    // Include credentials so Better Auth session cookies are sent on every request
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
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
