const Meeting = require('../models/Meeting');
const ExchangeRequest = require('../models/ExchangeRequest');
const Student = require('../models/Student');
const Message = require('../models/Message');
const emailService = require('../services/emailService');

/**
 * POST /api/meetings/schedule
 * Schedules a peer study meeting and sends email invites with .ics calendar attachments.
 */
const scheduleMeeting = async (req, res) => {
  try {
    const {
      requestId,
      topic = 'Skill Exchange Session',
      spot = 'Campus Library (Collab Area)',
      startTime,
      durationMinutes = 45,
      isVirtual = false,
      customMeetingLink = '',
      sendEmail = true,
    } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Exchange request ID is required',
      });
    }

    if (!startTime) {
      return res.status(400).json({
        success: false,
        message: 'Meeting start time is required',
      });
    }

    // Verify the ExchangeRequest exists
    const exchangeRequest = await ExchangeRequest.findById(requestId)
      .populate('sender', 'name email profileImage')
      .populate('recipient', 'name email profileImage');

    if (!exchangeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Exchange request not found',
      });
    }

    const currentStudentId = String(req.student._id);
    const senderId = String(exchangeRequest.sender?._id || exchangeRequest.sender);
    const recipientId = String(exchangeRequest.recipient?._id || exchangeRequest.recipient);

    if (currentStudentId !== senderId && currentStudentId !== recipientId) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this exchange request',
      });
    }

    // Determine organizer and attendee
    const isSenderCurrent = currentStudentId === senderId;
    const organizer = isSenderCurrent ? exchangeRequest.sender : exchangeRequest.recipient;
    const attendee = isSenderCurrent ? exchangeRequest.recipient : exchangeRequest.sender;

    // Check if it's virtual
    const spotLower = String(spot).toLowerCase();
    const isVirtualFinal = isVirtual || spotLower.includes('virtual') || spotLower.includes('call') || spotLower.includes('meet');
    let meetingLinkFinal = customMeetingLink.trim();
    if (!meetingLinkFinal && isVirtualFinal) {
      const p1 = Math.random().toString(36).substring(2, 5);
      const p2 = Math.random().toString(36).substring(2, 6);
      const p3 = Math.random().toString(36).substring(2, 5);
      meetingLinkFinal = `https://meet.google.com/${p1}-${p2}-${p3}`;
    }

    // Create the meeting record
    const meeting = new Meeting({
      requestId: exchangeRequest._id,
      organizer: organizer._id,
      attendee: attendee._id,
      topic: topic.trim(),
      spot: spot.trim(),
      isVirtual: isVirtualFinal,
      meetingLink: meetingLinkFinal,
      startTime: new Date(startTime),
      durationMinutes: Number(durationMinutes) || 45,
      status: 'scheduled',
    });

    // Generate Google Calendar direct scheduling URL
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const startObj = new Date(meeting.startTime);
    const durationNum = meeting.durationMinutes || 45;
    const endObj = new Date(startObj.getTime() + durationNum * 60 * 1000);
    const startIso = startObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endIso = endObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const gCalDescription = `Skill exchange session on SkillSwap Campus.\nTopic: ${meeting.topic}\nOrganizer: ${organizer.name} (${organizer.email || ''})\nAttendee: ${attendee.name} (${attendee.email || ''})\nLocation: ${meeting.spot}${meeting.meetingLink ? `\nMeeting Link: ${meeting.meetingLink}` : ''}\nSkillSwap: ${clientOrigin}/requests`;

    const gCalParams = new URLSearchParams({
      action: 'TEMPLATE',
      text: `SkillSwap: ${meeting.topic} w/ ${attendee.name}`,
      dates: `${startIso}/${endIso}`,
      details: gCalDescription,
      location: meeting.meetingLink || meeting.spot,
    });
    if (attendee?.email) {
      gCalParams.set('add', attendee.email);
    }
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?${gCalParams.toString()}`;
    meeting.googleCalendarUrl = googleCalendarUrl;

    let previewUrl = null;
    let emailSentSuccessfully = false;

    // Send email invitations
    if (sendEmail && attendee?.email) {
      try {
        const emailResult = await emailService.sendMeetingInvitation({
          to: attendee.email,
          recipientName: attendee.name,
          senderName: organizer.name,
          senderEmail: organizer.email,
          topic: meeting.topic,
          startTime: meeting.startTime,
          durationMinutes: meeting.durationMinutes,
          spot: meeting.spot,
          meetingLink: meeting.meetingLink,
          clientOrigin,
        });

        emailSentSuccessfully = true;
        previewUrl = emailResult.previewUrl || null;
        meeting.emailSent = true;
        meeting.emailPreviewUrl = previewUrl || '';

        console.log(`[MeetingController] Email invite sent to ${attendee.email}`);
      } catch (emailErr) {
        console.error('[MeetingController] Failed to send email invite:', emailErr.message);
        // Do not crash meeting creation if mail fails
      }
    }

    await meeting.save();

    // Automatically post session proposal message to the chat
    const summaryText = `📅 Study Session Scheduled: ${meeting.spot} on ${new Date(
      meeting.startTime
    ).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })} (${meeting.durationMinutes} mins) — "${meeting.topic}"`;

    let postedMessage = null;
    try {
      postedMessage = await Message.create({
        exchangeRequest: exchangeRequest._id,
        sender: req.student._id,
        text: summaryText,
        type: 'session_proposal',
        metadata: {
          meetingId: meeting._id,
          spot: meeting.spot,
          startTime: meeting.startTime,
          durationMinutes: meeting.durationMinutes,
          topic: meeting.topic,
          isVirtual: meeting.isVirtual,
          meetingLink: meeting.meetingLink,
          googleCalendarUrl: googleCalendarUrl,
          emailSent: emailSentSuccessfully,
          previewUrl: previewUrl,
        },
      });
      await postedMessage.populate('sender', 'name profileImage');
    } catch (msgErr) {
      console.error('[MeetingController] Failed to log chat message:', msgErr.message);
    }

    return res.status(201).json({
      success: true,
      message: emailSentSuccessfully
        ? `Meeting scheduled and Google Calendar invite sent to ${attendee.email}!`
        : 'Meeting scheduled successfully!',
      meeting,
      googleCalendarUrl,
      emailSent: emailSentSuccessfully,
      previewUrl,
      postedMessage,
    });
  } catch (error) {
    console.error('[MeetingController] Schedule error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to schedule meeting',
    });
  }
};

/**
 * GET /api/meetings/request/:requestId
 * Retrieves all meetings associated with a specific exchange request.
 */
const getMeetingsForRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const meetings = await Meeting.find({ requestId })
      .populate('organizer', 'name email profileImage')
      .populate('attendee', 'name email profileImage')
      .sort({ startTime: 1 });

    return res.status(200).json({
      success: true,
      meetings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve meetings',
    });
  }
};

/**
 * PATCH /api/meetings/:id/cancel
 * Cancels a scheduled meeting.
 */
const cancelMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    meeting.status = 'cancelled';
    await meeting.save();

    return res.status(200).json({
      success: true,
      message: 'Meeting cancelled',
      meeting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel meeting',
    });
  }
};

module.exports = {
  scheduleMeeting,
  getMeetingsForRequest,
  cancelMeeting,
};
