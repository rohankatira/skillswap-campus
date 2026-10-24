
const Student = require('../models/Student');
const ExchangeRequest = require('../models/ExchangeRequest');

const PUBLIC_FIELDS = '-__v -userId';
const MAX_SKILLS = 20;
const MAX_SKILL_LENGTH = 50;

// Accepts an array or a comma-separated string; returns a clean, de-duplicated array.
function normalizeSkills(value) {
  if (value === undefined) return undefined;

  const list = Array.isArray(value) ? value : String(value).split(',');
  const seen = new Set();
  const skills = [];

  for (const raw of list) {
    const skill = String(raw).trim().slice(0, MAX_SKILL_LENGTH);
    const key = skill.toLowerCase();

    if (skill && !seen.has(key)) {
      seen.add(key);
      skills.push(skill);
    }
  }

  return skills.slice(0, MAX_SKILLS);
}

// Picks only the fields a student is allowed to edit on their own profile.
function pickProfileFields(body) {
  const updates = {};

  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.course !== undefined) updates.course = String(body.course).trim();
  if (body.bio !== undefined) updates.bio = String(body.bio).trim();
  if (body.profileImage !== undefined) updates.profileImage = String(body.profileImage).trim();

  const teachSkills = normalizeSkills(body.teachSkills);
  const learnSkills = normalizeSkills(body.learnSkills);
  if (teachSkills !== undefined) updates.teachSkills = teachSkills;
  if (learnSkills !== undefined) updates.learnSkills = learnSkills;

  return updates;
}

function sendError(res, error, fallbackMessage) {
  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid student ID' });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A profile already exists for this account',
    });
  }

  return res.status(500).json({ success: false, message: fallbackMessage });
}

// GET /api/students - Get all students (public)
const getStudents = async (req, res) => {
  try {
    const students = await Student.find().select(PUBLIC_FIELDS).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    sendError(res, error, 'Failed to fetch students');
  }
};

// GET /api/students/:id - Get one student (public)
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select(PUBLIC_FIELDS);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({ success: true, student });
  } catch (error) {
    sendError(res, error, 'Failed to fetch student');
  }
};

// GET /api/students/me - Get the logged-in user's profile (auth)
// Returns `student: null` (not 404) when the user hasn't created one yet.
const getMyProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).select('-__v');

    res.status(200).json({ success: true, student: student || null });
  } catch (error) {
    sendError(res, error, 'Failed to fetch your profile');
  }
};

// PUT /api/students/me  (also POST /api/students)
// Create or update the logged-in user's profile (auth).
// Email always comes from the authenticated account, never from the request body.
const saveMyProfile = async (req, res) => {
  try {
    const updates = pickProfileFields(req.body);
    const email = String(req.user.email || '').trim().toLowerCase();

    let student = await Student.findOne({ userId: req.user.id });

    // First time: claim an older unlinked profile with the same email, if any.
    if (!student) {
      const existingByEmail = await Student.findOne({ email });

      if (existingByEmail?.userId && existingByEmail.userId !== req.user.id) {
        return res.status(409).json({
          success: false,
          message: 'This email is already linked to another profile',
        });
      }

      student = existingByEmail;
    }

    const isNew = !student;

    if (isNew) {
      if (!updates.course) {
        return res.status(400).json({
          success: false,
          message: 'Course is required',
        });
      }

      student = new Student({
        name: updates.name || req.user.name,
        email,
        ...updates,
      });
    } else {
      student.set(updates);
    }

    student.userId = req.user.id;
    if (!student.name) student.name = req.user.name;

    await student.save();

    res.status(isNew ? 201 : 200).json({
      success: true,
      student: student.toObject({ versionKey: false }),
    });
  } catch (error) {
    sendError(res, error, 'Failed to save your profile');
  }
};

// PUT /api/students/:id - Update a student (auth, owner only)
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (student.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own profile',
      });
    }

    student.set(pickProfileFields(req.body));
    await student.save();

    res.status(200).json({
      success: true,
      student: student.toObject({ versionKey: false }),
    });
  } catch (error) {
    sendError(res, error, 'Failed to update student');
  }
};

// DELETE /api/students/:id - Delete a student (auth, owner only)
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (student.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own profile',
      });
    }

    await ExchangeRequest.deleteMany({
      $or: [{ sender: student._id }, { recipient: student._id }],
    });
    await student.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    sendError(res, error, 'Failed to delete student');
  }
};

module.exports = {
  getStudents,
  getStudentById,
  getMyProfile,
  saveMyProfile,
  updateStudent,
  deleteStudent,
};
