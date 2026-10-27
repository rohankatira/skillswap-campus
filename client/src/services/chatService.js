
import { apiRequest } from './api';

/**
 * Fetch messages for an accepted exchange request.
 * @param {string} requestId - The ExchangeRequest._id
 * @returns {Promise<Array>} Array of message objects
 */
export async function getMessages(requestId) {
  const data = await apiRequest(`/chat/${requestId}/messages`);
  return Array.isArray(data.messages) ? data.messages : [];
}

/**
 * Send a message to the chat for an accepted exchange request.
 * @param {string} requestId - The ExchangeRequest._id
 * @param {string} text - The message text
 * @param {string} [type='text'] - Message type ('text', 'session_proposal', 'roadmap_share')
 * @param {object} [metadata=null] - Optional metadata (for sessions, roadmap)
 * @returns {Promise<Object>} The newly created message object
 */
export async function sendMessage(requestId, text, type = 'text', metadata = null) {
  const data = await apiRequest(`/chat/${requestId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text, type, metadata }),
  });
  return data.message;
}

/**
 * Fetch shared workspace (notes, saved roadmap) for an exchange request.
 */
export async function getWorkspace(requestId) {
  const data = await apiRequest(`/chat/${requestId}/workspace`);
  return {
    sharedNotes: data.sharedNotes || '',
    savedRoadmap: data.savedRoadmap || null,
  };
}

/**
 * Update shared workspace data (notes, saved roadmap) for an exchange request.
 */
export async function updateWorkspace(requestId, payload) {
  const data = await apiRequest(`/chat/${requestId}/workspace`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}
