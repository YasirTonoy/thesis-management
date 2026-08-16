const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    abstract: {
      type: String,
      required: [true, 'Abstract is required']
    },
    keywords: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'revision'],
      default: 'pending'
    },
    supervisorFeedback: {
      type: String,
      default: ''
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    revisionHistory: [
      {
        abstract: String,
        date: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Proposal', proposalSchema);
