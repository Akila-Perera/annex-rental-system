const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema(
  {
    // ── Linked user (must be logged in) ──────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,        // guests cannot submit tickets
    },

    // ── Ticket details ────────────────────────────────────────────
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },

    // ── AI response fields ────────────────────────────────────────
    aiResponse: {
      type: String,
      default: null,
    },
    aiStatus: {
      type: String,
      enum: ['pending', 'processing', 'sent', 'failed'],
      default: 'pending',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index so we can quickly fetch all tickets for a user
supportSchema.index({ userId: 1, createdAt: -1 });

const Support = mongoose.model('Support', supportSchema);

module.exports = Support;