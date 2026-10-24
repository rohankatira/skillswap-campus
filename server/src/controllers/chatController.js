
const mongoose = require('mongoose');
const ExchangeRequest = require('../models/ExchangeRequest');
const Message = require('../models/Message');

/**
 * Check that the logged-in student is a participant (sender or recipient)
 * of the given accepted ExchangeRequest.
 * Returns the request doc or null.
 */
async function getAuthorizedRequest(requestId, studentId) {
  if (!mongoose.isValidObjectId(requestId)) return null;

  const request = await ExchangeRequest.findById(requestId);
  if (!request || request.status !== 'accepted') return null;

  const senderId = request.sender;
  const recipientId = request.recipient;

  const isParticipant =
    senderId.equals(studentId) || recipientId.equals(studentId);
  if (!isParticipant) return null;

  return request;
}

// GET /api/chat/:requestId/messages
const getMessages = async (req, res) => {
  try {
    const request = await getAuthorizedRequest(
      req.params.requestId,
      req.student._id
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied',
      });
    }

    // Optional: cursor-based pagination via ?before=<timestamp>
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before ? new Date(req.query.before) : null;

    const filter = { exchangeRequest: request._id };
    if (before) filter.createdAt = { $lt: before };

    const messages = await Message.find(filter)
      .sort({ createdAt: before ? -1 : 1 }) // reverse when paginating back
      .limit(limit)
      .populate('sender', 'name profileImage');

    // When paginating back, reverse so caller always gets oldest→newest
    if (before) messages.reverse();

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// POST /api/chat/:requestId/messages
const sendMessage = async (req, res) => {
  try {
    const request = await getAuthorizedRequest(
      req.params.requestId,
      req.student._id
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied',
      });
    }

    const text = String(req.body.text || '').trim();
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required',
      });
    }

    const message = await Message.create({
      exchangeRequest: request._id,
      sender: req.student._id,
      text,
    });

    await message.populate('sender', 'name profileImage');

    res.status(201).json({ success: true, message });
  } catch (error) {
    const badInput =
      error.name === 'ValidationError' || error.name === 'CastError';
    res.status(badInput ? 400 : 500).json({
      success: false,
      message: badInput ? error.message : 'Failed to send message',
    });
  }
};

module.exports = { getMessages, sendMessage };
