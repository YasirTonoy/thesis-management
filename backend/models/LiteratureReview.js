const mongoose = require('mongoose');

const literatureReviewSchema = new mongoose.Schema(
  {
    proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    paperName: { type: String, required: [true, 'Paper name is required'], trim: true },
    author: { type: String, required: [true, 'Author is required'], trim: true },
    year: { type: String, trim: true, default: '' },
    journal: { type: String, trim: true, default: '' },
    review: { type: String, required: [true, 'Review is required'], trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LiteratureReview', literatureReviewSchema);
