const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema(
  {
    proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Paper title is required'], trim: true },
    authors: { type: String, required: [true, 'Authors are required'], trim: true },
    journalName: { type: String, required: [true, 'Journal/venue name is required'], trim: true },
    status: { type: String, enum: ['submitted', 'under_review', 'accepted', 'published'], default: 'submitted' },
    volumeIssue: { type: String, default: '', trim: true },
    publicationDate: { type: Date },
    link: { type: String, default: '', trim: true },
    document: { filename: String, originalName: String, url: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Publication', publicationSchema);
