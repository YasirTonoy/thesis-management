const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['milestone_due', 'milestone_overdue', 'defense_upcoming', 'meeting_upcoming', 'submission_returned'],
      required: true
    },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    title: { type: String, required: true, trim: true },
    message: { type: String, default: '', trim: true },
    link: { type: String, default: '' },
    dueAt: { type: Date },
    /** Stable per-reminder key so the same reminder is never created twice for a user. */
    dedupeKey: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date }
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, dedupeKey: 1 }, { unique: true });
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
