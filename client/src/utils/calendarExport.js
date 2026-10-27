/**
 * calendarExport.js — Utility to generate and download an iCalendar (.ics) file
 * compatible with Google Calendar, Apple Calendar, Outlook, and mobile devices.
 */

function formatIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Downloads an .ics calendar file for a study session.
 *
 * @param {Object} options
 * @param {string} options.title - Meeting title
 * @param {string} options.description - Meeting details or agenda
 * @param {string} options.location - Campus spot or virtual room URL
 * @param {Date|string} options.startTime - Date object or ISO string
 * @param {number} [options.durationMinutes=60] - Duration in minutes
 */
export function downloadCalendarEvent({
  title = 'SkillSwap Campus Session',
  description = 'Peer learning exchange session on SkillSwap Campus.',
  location = 'Campus Library (Collab Zone)',
  startTime = new Date(),
  durationMinutes = 60,
}) {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SkillSwap Campus//Study Session//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:skillswap-${Date.now()}@skillswap.campus`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location.replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: SkillSwap session starting in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `skillswap-${start.toISOString().slice(0, 10)}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a direct Google Calendar web intent URL.
 * When clicked, it opens Google Calendar with title, time, duration, location,
 * details, and attendee pre-filled.
 *
 * @param {Object} options
 * @param {string} options.title - Meeting title
 * @param {string} options.description - Detailed notes/agenda
 * @param {string} options.location - Campus spot or meeting link
 * @param {string} [options.meetingLink] - Google Meet or video conference link
 * @param {Date|string} options.startTime - Date object or ISO string
 * @param {number} [options.durationMinutes=45] - Duration in minutes
 * @param {string} [options.attendeeEmail] - Attendee email to invite
 * @returns {string} Google Calendar URL
 */
export function generateGoogleCalendarUrl({
  title = 'SkillSwap Campus Session',
  description = '',
  location = '',
  meetingLink = '',
  startTime = new Date(),
  durationMinutes = 45,
  attendeeEmail = '',
}) {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + (Number(durationMinutes) || 45) * 60 * 1000);

  const formatGCalDate = (date) =>
    date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const finalLocation = meetingLink ? meetingLink : location;

  let finalDetails = description;
  if (meetingLink && !finalDetails.includes(meetingLink)) {
    finalDetails = `📹 Video Meeting Link: ${meetingLink}\n\n${finalDetails}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatGCalDate(start)}/${formatGCalDate(end)}`,
    details: finalDetails,
    location: finalLocation,
  });

  if (attendeeEmail) {
    params.set('add', attendeeEmail);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Opens Google Calendar event creation directly in a new tab.
 */
export function openGoogleCalendarEvent(options) {
  const url = generateGoogleCalendarUrl(options);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return url;
}

