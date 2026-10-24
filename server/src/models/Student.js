
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    // Links this profile to the Better Auth user (user.id).
    // Sparse so older profiles without a linked account are still valid.
    userId: {
      type: String,
      unique: true,
      sparse: true,
    },

    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },

    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
      maxlength: 100,
    },

    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    teachSkills: {
      type: [String],
      default: [],
    },

    learnSkills: {
      type: [String],
      default: [],
    },

    profileImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Student', studentSchema);
