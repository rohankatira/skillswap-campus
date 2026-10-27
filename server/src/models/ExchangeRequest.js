
const mongoose = require('mongoose');

const exchangeRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Sender is required'],
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Recipient is required'],
      validate: {
        validator: function (value) {
          return !this.sender || !value || !this.sender.equals(value);
        },
        message: 'A student cannot send a request to themselves',
      },
    },

    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },

    sharedNotes: {
      type: String,
      default: '',
      maxlength: 10000,
    },

    savedRoadmap: {
      type: Array,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

exchangeRequestSchema.index({ sender: 1, createdAt: -1 });
exchangeRequestSchema.index({ recipient: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('ExchangeRequest', exchangeRequestSchema);
