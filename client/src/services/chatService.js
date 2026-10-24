
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
 * @returns {Promise<Object>} The newly created message object
 */
export async function sendMessage(requestId, text) {
  const data = await apiRequest(`/chat/${requestId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return data.message;
}
