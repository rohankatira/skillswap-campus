import { apiRequest } from './api';

/**
 * Schedules a study meeting and triggers email service invitations.
 *
 * @param {Object} data
 * @param {string} data.requestId - The ExchangeRequest ID
 * @param {string} data.topic - Study topic
 * @param {string} data.spot - Campus location or Virtual
 * @param {string} data.startTime - ISO string for scheduled start time
 * @param {number} data.durationMinutes - Duration in minutes
 * @param {boolean} [data.isVirtual] - Whether it's online
 * @param {string} [data.customMeetingLink] - Custom Google Meet / Zoom link
 * @param {boolean} [data.sendEmail=true] - Whether to trigger automated email
 */
export async function scheduleMeeting(data) {
  return await apiRequest('/meetings/schedule', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Retrieves all meetings associated with a specific exchange request.
 *
 * @param {string} requestId
 */
export async function getMeetingsForRequest(requestId) {
  const result = await apiRequest(`/meetings/request/${requestId}`);
  return result.meetings || [];
}

/**
 * Cancels a scheduled meeting.
 *
 * @param {string} id - Meeting ID
 */
export async function cancelMeeting(id) {
  return await apiRequest(`/meetings/${id}/cancel`, {
    method: 'PATCH',
  });
}
