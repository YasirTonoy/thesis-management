const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    supervision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supervision',
      required: true
    },
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
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'rejected'],
      default: 'pending'
    },
    submissionComment: {
      type: String,
      default: ''
    },
    submissionDate: {
      type: Date
    },
    feedback: {
      type: String,
      default: ''
    },
    feedbackDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Milestone', milestoneSchema);
