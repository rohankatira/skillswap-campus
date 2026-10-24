
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // The accepted ExchangeRequest that unlocked this chat
    exchangeRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExchangeRequest',
      required: [true, 'Exchange request is required'],
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Sender is required'],
    },

    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

// Efficient retrieval of a conversation's messages in chronological order
messageSchema.index({ exchangeRequest: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
