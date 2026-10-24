
const express = require('express');
const router = express.Router();

const {
  requireAuth,
  requireStudentProfile,
} = require('../middleware/requireAuth');
const {
  getRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
} = require('../controllers/requestController');

// Every request route needs a signed-in user with a student profile.
router.use(requireAuth, requireStudentProfile);

// GET /api/requests - Get my exchange requests (sent + received)
router.get('/', getRequests);

// GET /api/requests/:id - Get one request
router.get('/:id', getRequestById);

// POST /api/requests - Send an exchange request
router.post('/', createRequest);

// PATCH /api/requests/:id/status - Accept or decline
router.patch('/:id/status', updateRequestStatus);

module.exports = router;
