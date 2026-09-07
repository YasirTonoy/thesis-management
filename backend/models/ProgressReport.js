const mongoose = require('mongoose');

const progressReportSchema = new mongoose.Schema(
  {
    proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    phase: { type: String, enum: ['p1', 'p2', 'defense'], required: true },
    description: { type: String, required: [true, 'Progress description is required'], trim: true },
    document: { filename: String, originalName: String, url: String },
    marks: { type: Number, default: null, min: 0, max: 100 },
    supervisorFeedback: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProgressReport', progressReportSchema);
