
const mongoose = require('mongoose');
const ExchangeRequest = require('../models/ExchangeRequest');
const Student = require('../models/Student');

const STUDENT_SUMMARY = 'name course teachSkills learnSkills profileImage';

function populateParticipants(query) {
  return query
    .populate('sender', STUDENT_SUMMARY)
    .populate('recipient', STUDENT_SUMMARY);
}

function isParticipant(request, studentId) {
  const senderId = request.sender?._id || request.sender;
  const recipientId = request.recipient?._id || request.recipient;

  return senderId?.equals(studentId) || recipientId?.equals(studentId);
}

// GET /api/requests - Requests I sent or received
const getRequests = async (req, res) => {
  try {
    const me = req.student._id;

    const requests = await populateParticipants(
      ExchangeRequest.find({ $or: [{ sender: me }, { recipient: me }] })
    ).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests',
    });
  }
};

// GET /api/requests/:id - Get one request (participants only)
const getRequestById = async (req, res) => {
  try {
    const request = await populateParticipants(
      ExchangeRequest.findById(req.params.id)
    );

    if (!request || !isParticipant(request, req.student._id)) {
      return res.status(404).json({
        success: false,
        message: 'Exchange request not found',
      });
    }

    res.status(200).json({ success: true, request });
  } catch (error) {
    const invalidId = error.name === 'CastError';

    res.status(invalidId ? 400 : 500).json({
      success: false,
      message: invalidId
        ? 'Invalid request ID'
        : 'Failed to fetch request',
    });
  }
};

// POST /api/requests - Send a request
// The sender is always the logged-in student; only the recipient comes from the body.
const createRequest = async (req, res) => {
  try {
    const sender = req.student._id;
    const recipientId = req.body.recipient || req.body.recipientId;
    const message = String(req.body.message || '').trim();

    if (!recipientId || !mongoose.isValidObjectId(recipientId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid recipient is required',
      });
    }

    if (sender.equals(recipientId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a request to yourself',
      });
    }

    const recipientExists = await Student.exists({ _id: recipientId });

    if (!recipientExists) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found',
      });
    }

    // Block duplicate pending requests in either direction.
    const pending = await ExchangeRequest.findOne({
      status: 'pending',
      $or: [
        { sender, recipient: recipientId },
        { sender: recipientId, recipient: sender },
      ],
    });

    if (pending) {
      const sentByMe = pending.sender.equals(sender);

      return res.status(409).json({
        success: false,
        message: sentByMe
          ? 'You already have a pending request with this student'
          : 'This student has already sent you a request — check My Requests',
      });
    }

    const request = await ExchangeRequest.create({
      sender,
      recipient: recipientId,
      message,
    });

    const populatedRequest = await request.populate([
      { path: 'sender', select: STUDENT_SUMMARY },
      { path: 'recipient', select: STUDENT_SUMMARY },
    ]);

    res.status(201).json({
      success: true,
      request: populatedRequest,
    });
  } catch (error) {
    const badInput = error.name === 'CastError' || error.name === 'ValidationError';

    res.status(badInput ? 400 : 500).json({
      success: false,
      message: badInput
        ? error.message
        : 'Failed to create exchange request',
    });
  }
};

// PATCH /api/requests/:id/status - Accept or decline (recipient only)
const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be accepted or declined',
      });
    }

    const request = await ExchangeRequest.findById(req.params.id);

    if (!request || !isParticipant(request, req.student._id)) {
      return res.status(404).json({
        success: false,
        message: 'Exchange request not found',
      });
    }

    if (!request.recipient.equals(req.student._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the recipient can accept or decline this request',
      });
    }

    if (request.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: `This request has already been ${request.status}`,
      });
    }

    request.status = status;
    await request.save();

    const populatedRequest = await request.populate([
      { path: 'sender', select: STUDENT_SUMMARY },
      { path: 'recipient', select: STUDENT_SUMMARY },
    ]);

    res.status(200).json({ success: true, request: populatedRequest });
  } catch (error) {
    const invalidId = error.name === 'CastError';

    res.status(invalidId ? 400 : 500).json({
      success: false,
      message: invalidId
        ? 'Invalid request ID'
        : 'Failed to update request',
    });
  }
};

module.exports = {
  getRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
};
