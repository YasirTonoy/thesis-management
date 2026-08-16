const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: { type: String, default: '' },
    authorRole: { type: String, default: 'member' },
    content: {
      type: String,
      required: [true, 'Reply content is required'],
      trim: true
    }
  },
  { timestamps: true }
);

const groupPostSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResearchGroup',
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: { type: String, default: '' },
    authorRole: { type: String, default: 'member' },
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true
    },
    attachmentUrl: {
      type: String,
      default: ''
    },
    attachmentName: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      enum: ['general', 'resource', 'question', 'announcement', 'paper'],
      default: 'general'
    },
    replies: [replySchema],
    isPinned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('GroupPost', groupPostSchema);
