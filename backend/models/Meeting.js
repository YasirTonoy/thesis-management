const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true
    },
    agenda: {
      type: String,
      default: ''
    },
    proposedDateTime: {
      type: Date,
      required: [true, 'Proposed date/time is required']
    },
    confirmedDateTime: {
      type: Date,
      default: null
    },
    location: {
      type: String,
      default: ''
    },
    meetingLink: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    supervisorNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Meeting', meetingSchema);
