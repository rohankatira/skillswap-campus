const express = require('express');
const router = express.Router();

const { requireAuth, requireStudentProfile } = require('../middleware/requireAuth');
const {
  scheduleMeeting,
  getMeetingsForRequest,
  cancelMeeting,
} = require('../controllers/meetingController');

// All meeting operations require an authenticated student profile
router.use(requireAuth, requireStudentProfile);

// POST  /api/meetings/schedule           — Schedule study meeting & trigger email invites
router.post('/schedule', scheduleMeeting);

// GET   /api/meetings/request/:requestId — Retrieve all meetings for this exchange request
router.get('/request/:requestId', getMeetingsForRequest);

// PATCH /api/meetings/:id/cancel        — Cancel a scheduled meeting
router.patch('/:id/cancel', cancelMeeting);

module.exports = router;
