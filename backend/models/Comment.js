const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      required: true
    },
    authorRole: {
      type: String,
      enum: ['student', 'supervisor', 'admin'],
      required: true
    },
    content: {
      type: String,
      required: [true, 'Comment content cannot be empty'],
      trim: true
    },
    category: {
      type: String,
      enum: ['general', 'feedback', 'suggestion', 'question', 'action_item'],
      default: 'general'
    },
    attachmentUrl: {
      type: String,
      default: ''
    },
    attachmentName: {
      type: String,
      default: ''
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Comment', commentSchema);
