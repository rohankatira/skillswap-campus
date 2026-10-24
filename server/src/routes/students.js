
const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/requireAuth');
const {
  getStudents,
  getStudentById,
  getMyProfile,
  saveMyProfile,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');

// GET /api/students - Get all students (public)
router.get('/', getStudents);

// GET /api/students/me - Get my profile (must be defined before /:id)
router.get('/me', requireAuth, getMyProfile);

// PUT /api/students/me - Create or update my profile
router.put('/me', requireAuth, saveMyProfile);

// POST /api/students - Create my profile (same as PUT /me)
router.post('/', requireAuth, saveMyProfile);

// GET /api/students/:id - Get one student (public)
router.get('/:id', getStudentById);

// PUT /api/students/:id - Update a student (owner only)
router.put('/:id', requireAuth, updateStudent);

// DELETE /api/students/:id - Delete a student (owner only)
router.delete('/:id', requireAuth, deleteStudent);

module.exports = router;
