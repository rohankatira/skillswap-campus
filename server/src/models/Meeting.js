const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExchangeRequest',
      required: [true, 'Exchange request ID is required'],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Organizer student is required'],
    },
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Attendee student is required'],
    },
    topic: {
      type: String,
      required: [true, 'Meeting topic is required'],
      trim: true,
      maxlength: 200,
    },
    spot: {
      type: String,
      required: [true, 'Meeting spot / location is required'],
      trim: true,
      maxlength: 200,
    },
    isVirtual: {
      type: Boolean,
      default: false,
    },
    meetingLink: {
      type: String,
      default: '',
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Meeting start time is required'],
    },
    durationMinutes: {
      type: Number,
      default: 45,
      min: 15,
      max: 240,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailPreviewUrl: {
      type: String,
      default: '',
    },
    googleCalendarUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

meetingSchema.index({ requestId: 1, startTime: 1 });
meetingSchema.index({ organizer: 1, startTime: 1 });
meetingSchema.index({ attendee: 1, startTime: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
