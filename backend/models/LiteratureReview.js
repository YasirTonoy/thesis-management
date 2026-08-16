const mongoose = require('mongoose');

const literatureReviewSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal'
  },
  paperName: {
    type: String,
    required: true
  },
  authors: {
    type: String,
    required: true
  },
  publicationYear: {
    type: Number,
    required: true
  },
  journalName: {
    type: String,
    required: true
  },
  paperLink: {
    type: String,
    default: ''
  },
  reviewText: {
    type: String,
    required: true
  },
  supervisorFeedback: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('LiteratureReview', literatureReviewSchema);
