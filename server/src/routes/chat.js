
const express = require('express');
const router = express.Router();

const { requireAuth, requireStudentProfile } = require('../middleware/requireAuth');
const { getMessages, sendMessage } = require('../controllers/chatController');

// All chat routes require a signed-in student with a profile
router.use(requireAuth, requireStudentProfile);

// GET  /api/chat/:requestId/messages  — fetch conversation history
router.get('/:requestId/messages', getMessages);

// POST /api/chat/:requestId/messages  — send a message
router.post('/:requestId/messages', sendMessage);

module.exports = router;
