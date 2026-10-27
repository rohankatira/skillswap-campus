const nodemailer = require('nodemailer');

let cachedTransporter = null;
let isTestAccount = false;

/**
 * Initializes and returns a Nodemailer transporter.
 * If SMTP credentials are configured in .env, it uses them (e.g., Gmail, SendGrid, Resend, Mailgun).
 * Otherwise, it creates an ephemeral Ethereal test inbox so emails send successfully
 * in local development without crashing or requiring credentials.
 */
async function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // 1. Production / Custom SMTP credentials
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    isTestAccount = false;
    return cachedTransporter;
  }

  // 2. Fallback to Ethereal Email test account for zero-config development
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isTestAccount = true;
    console.log(`[EmailService] Using Ethereal test account: ${testAccount.user}`);
    return cachedTransporter;
  } catch (err) {
    console.warn('[EmailService] Failed to create test account, falling back to mock transport:', err.message);
    // Mock transport that doesn't fail
    return {
      sendMail: async (opts) => {
        console.log('[EmailService Mock] Message sent to:', opts.to);
        return { messageId: `mock-${Date.now()}` };
      },
    };
  }
}

/**
 * Format a Date object into iCalendar UTC timestamp format (YYYYMMDDTHHMMSSZ).
 */
function formatIcsDate(date) {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generates an RFC 5545 compliant iCalendar string for calendar invite attachments.
 */
function generateIcsContent({
  uid,
  title,
  description,
  location,
  startTime,
  durationMinutes = 45,
  organizerEmail,
  organizerName,
  attendeeEmail,
  attendeeName,
}) {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const now = new Date();

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SkillSwap Campus//Study Session Meeting//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid || `skillswap-${Date.now()}@skillswap.campus`}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location.replace(/,/g, '\\,')}`,
    `ORGANIZER;CN=${organizerName || 'SkillSwap Student'}:mailto:${organizerEmail || 'noreply@skillswap.campus'}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${attendeeName || 'Student'}:mailto:${attendeeEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:SkillSwap Study Session starts in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Sends a meeting invitation email with an attached .ics calendar invite.
 */
async function sendMeetingInvitation({
  to,
  recipientName,
  senderName,
  senderEmail,
  topic,
  startTime,
  durationMinutes = 45,
  spot,
  meetingLink,
  clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173',
}) {
  const transporter = await getTransporter();
  const dateObj = new Date(startTime);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isVirtual = Boolean(meetingLink) || (spot && spot.toLowerCase().includes('virtual'));
  const effectiveMeetingLink = meetingLink || (isVirtual ? 'https://meet.google.com/new' : '');

  const startIso = dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endIso = new Date(dateObj.getTime() + (durationMinutes || 45) * 60 * 1000)
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0] + 'Z';

  const gCalDescription = `Skill exchange session between ${senderName} and ${recipientName}.\nTopic: ${topic}\nLocation: ${spot || 'Virtual Study Room'}${
    effectiveMeetingLink ? `\nMeeting Link: ${effectiveMeetingLink}` : ''
  }\nSkillSwap: ${clientOrigin}/requests`;

  const gCalParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: `SkillSwap: ${topic} w/ ${senderName}`,
    dates: `${startIso}/${endIso}`,
    details: gCalDescription,
    location: effectiveMeetingLink || spot || 'Online Video Room',
  });
  if (to) {
    gCalParams.set('add', to);
  }
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?${gCalParams.toString()}`;

  const uid = `meet-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@skillswap.campus`;

  const icsData = generateIcsContent({
    uid,
    title: `SkillSwap: ${topic} w/ ${senderName}`,
    description: `Skill exchange session between ${senderName} and ${recipientName}.\nTopic: ${topic}\nLocation: ${spot || 'Virtual Study Room'}${effectiveMeetingLink ? `\nMeeting Link: ${effectiveMeetingLink}` : ''}`,
    location: spot || 'Online Video Room',
    startTime: dateObj,
    durationMinutes,
    organizerEmail: senderEmail || 'no-reply@skillswap.campus',
    organizerName: senderName,
    attendeeEmail: to,
    attendeeName: recipientName,
  });

  const emailSubject = `SkillSwap Campus: Study Session with ${senderName} (${topic})`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; color: #111827; }
    .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 28px; text-align: left; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 28px; }
    .badge { display: inline-block; background-color: #eef2ff; color: #4338ca; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em; }
    .title { font-size: 20px; font-weight: 700; margin: 0 0 16px; color: #111827; }
    .card { background-color: #f9fafb; border-radius: 12px; border: 1px solid #f3f4f6; padding: 20px; margin-bottom: 24px; }
    .item { display: flex; align-items: flex-start; margin-bottom: 14px; font-size: 14px; }
    .item:last-child { margin-bottom: 0; }
    .label { font-weight: 600; width: 110px; color: #6b7280; flex-shrink: 0; }
    .val { color: #111827; font-weight: 500; word-break: break-word; }
    .btn-group { margin: 28px 0 20px; text-align: center; }
    .btn-gcal { display: inline-block; background: #1a73e8; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 22px; border-radius: 10px; box-shadow: 0 2px 8px rgba(26,115,232,0.3); margin: 4px; }
    .btn-secondary { display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 22px; border-radius: 10px; margin: 4px; box-shadow: 0 2px 8px rgba(5,150,105,0.3); }
    .btn-primary { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 22px; border-radius: 10px; box-shadow: 0 2px 8px rgba(79,70,229,0.3); margin: 4px; }
    .footer { border-top: 1px solid #f3f4f6; padding: 20px 28px; background-color: #fafafa; font-size: 12px; color: #6b7280; text-align: center; line-height: 1.5; }
    .note { margin-top: 16px; font-size: 13px; color: #4b5563; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SkillSwap Campus</h1>
      <p>Peer-to-Peer Study & Skill Exchange</p>
    </div>
    <div class="content">
      <span class="badge">Study Session Scheduled</span>
      <h2 class="title">${senderName} scheduled a study session with you!</h2>
      
      <p style="font-size: 14px; color: #4b5563; margin-top: 0; line-height: 1.6;">
        You have a scheduled skill exchange meeting on SkillSwap Campus. Check out the details below:
      </p>

      <div class="card">
        <div class="item">
          <span class="label">🎯 Focus Topic:</span>
          <span class="val" style="font-weight: 700; color: #4338ca;">${topic}</span>
        </div>
        <div class="item">
          <span class="label">👤 Partner:</span>
          <span class="val">${senderName} (${senderEmail || 'SkillSwap Member'})</span>
        </div>
        <div class="item">
          <span class="label">📅 Date & Time:</span>
          <span class="val">${formattedDate} at ${formattedTime}</span>
        </div>
        <div class="item">
          <span class="label">⏱️ Duration:</span>
          <span class="val">${durationMinutes} minutes</span>
        </div>
        <div class="item">
          <span class="label">📍 Location:</span>
          <span class="val">${spot}</span>
        </div>
        ${
          effectiveMeetingLink
            ? `
        <div class="item">
          <span class="label">🌐 Video Room:</span>
          <span class="val"><a href="${effectiveMeetingLink}" target="_blank" style="color: #059669; font-weight: 600;">${effectiveMeetingLink}</a></span>
        </div>`
            : ''
        }
      </div>

      <div class="btn-group">
        <a href="${googleCalendarUrl}" target="_blank" class="btn-gcal">📅 Add to Google Calendar</a>
        ${
          effectiveMeetingLink
            ? `<a href="${effectiveMeetingLink}" target="_blank" class="btn-secondary">📹 Join Video Meeting</a>`
            : ''
        }
        <a href="${clientOrigin}/requests" target="_blank" class="btn-primary">💬 Open SkillSwap Chat</a>
      </div>

      <div class="note">
        📅 <strong>Google Calendar & iCal Support:</strong> Click <em>"Add to Google Calendar"</em> above to automatically sync this session and set reminders on your Google account. We've also attached an <code>.ics</code> calendar file for Apple Calendar or Outlook.
      </div>
    </div>
    <div class="footer">
      Sent with ❤️ by SkillSwap Campus · Empowering students to learn and teach together.<br/>
      If you did not request this session, you can manage your preferences on your profile.
    </div>
  </div>
</body>
</html>
  `;

  const systemSenderAddress = process.env.SMTP_USER || process.env.SMTP_FROM || 'noreply@skillswap.campus';

  const mailOptions = {
    from: `"SkillSwap Campus" <${systemSenderAddress}>`,
    to,
    cc: senderEmail && senderEmail !== to ? senderEmail : undefined,
    // When the recipient clicks 'Reply', it replies directly to the student who scheduled the meeting!
    replyTo: senderEmail ? `"${senderName}" <${senderEmail}>` : systemSenderAddress,
    subject: emailSubject,
    html: htmlBody,
    text: `SkillSwap Campus Session Scheduled!\n\nTopic: ${topic}\nWith: ${senderName}\nWhen: ${formattedDate} at ${formattedTime} (${durationMinutes} mins)\nLocation: ${spot}\n${effectiveMeetingLink ? `Meeting Link: ${effectiveMeetingLink}\n` : ''}\nOpen SkillSwap: ${clientOrigin}/requests`,
    icalEvent: {
      filename: 'invite.ics',
      method: 'REQUEST',
      content: icsData,
    },
    alternatives: [
      {
        contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
        contentDisposition: 'inline; filename="meeting.ics"',
        content: icsData,
      },
    ],
    attachments: [
      {
        filename: 'invite.ics',
        content: icsData,
        contentType: 'text/calendar',
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  let previewUrl = null;

  if (isTestAccount && nodemailer.getTestMessageUrl) {
    previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EmailService] ✉️ Email sent! Preview URL: ${previewUrl}`);
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
    googleCalendarUrl,
  };
}

/**
 * Sends a verification OTP email to a student during registration or sign in.
 *
 * @param {Object} params
 * @param {string} params.email - Recipient email address
 * @param {string} params.otp - 6-digit verification code
 * @param {'email-verification'|'sign-in'|'forget-password'|'change-email'} [params.type] - The OTP context
 */
async function sendOtpEmail({ email, otp, type = 'email-verification' }) {
  const transporter = await getTransporter();

  const isLogin = type === 'sign-in';
  const isReset = type === 'forget-password';

  const badgeText = isLogin ? 'SIGN-IN CODE' : isReset ? 'RESET CODE' : 'EMAIL VERIFICATION';
  const heading = isLogin
    ? 'Your SkillSwap Sign-In Code'
    : isReset
    ? 'Reset Your SkillSwap Password'
    : 'Verify Your SkillSwap Campus Email';

  const subtitle = isLogin
    ? 'Use the 6-digit code below to securely sign in to your SkillSwap Campus account.'
    : isReset
    ? 'Use the 6-digit code below to reset your SkillSwap Campus account password.'
    : 'Welcome to SkillSwap Campus! Use the 6-digit code below to verify your email address and activate your account.';

  const subject = `[SkillSwap Campus] ${otp} is your verification code`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    .wrapper { max-width: 540px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 24px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(255, 255, 255, 0.2); border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
    .content { padding: 36px 28px; }
    .greeting { font-size: 15px; color: #475569; line-height: 1.6; margin-top: 0; margin-bottom: 24px; }
    .otp-box { background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 16px; padding: 24px 16px; text-align: center; margin: 28px 0; }
    .otp-digits { font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #15803d; display: inline-block; padding-left: 12px; }
    .timer { font-size: 13px; color: #166534; font-weight: 600; margin-top: 10px; }
    .security-notice { background: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 18px; border-radius: 8px; margin-top: 24px; }
    .security-notice p { margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="badge">${badgeText}</div>
      <h1>🎓 SkillSwap Campus</h1>
    </div>
    <div class="content">
      <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a;">${heading}</h2>
      <p class="greeting">${subtitle}</p>

      <div class="otp-box">
        <div class="otp-digits">${otp}</div>
        <div class="timer">⏱️ Valid for 5 minutes</div>
      </div>

      <p class="greeting" style="font-size: 14px; margin-bottom: 0;">
        Enter this code in your browser to verify your email. If you did not make this request, you can safely ignore this email.
      </p>

      <div class="security-notice">
        <p><strong>Security Reminder:</strong> Never share this code with anyone. SkillSwap Campus staff will never ask for your verification code.</p>
      </div>
    </div>
    <div class="footer">
      Sent with ❤️ by SkillSwap Campus · Learn & Share Skills with Classmates<br>
      © ${new Date().getFullYear()} SkillSwap Campus
    </div>
  </div>
</body>
</html>
  `;

  const systemSenderAddress = process.env.SMTP_USER || process.env.SMTP_FROM || 'noreply@skillswap.campus';

  const mailOptions = {
    from: `"SkillSwap Campus" <${systemSenderAddress}>`,
    to: email,
    subject,
    html,
    text: `SkillSwap Campus: ${heading}\n\nYour 6-digit verification code is: ${otp}\n\nThis code is valid for 5 minutes.\nIf you did not make this request, you can safely ignore this email.`,
  };

  const info = await transporter.sendMail(mailOptions);
  let previewUrl = null;

  if (isTestAccount && nodemailer.getTestMessageUrl) {
    previewUrl = nodemailer.getTestMessageUrl(info);
  }

  console.log('\n============================================================');
  console.log(`🔐 [SkillSwap OTP] Recipient: ${email}`);
  console.log(`🔑 [SkillSwap OTP] Code:      [ ${otp} ] (${type})`);
  if (previewUrl) {
    console.log(`📬 [SkillSwap OTP] Preview:   ${previewUrl}`);
  }
  console.log('============================================================\n');

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
  };
}

module.exports = {
  sendMeetingInvitation,
  generateIcsContent,
  sendOtpEmail,
};

