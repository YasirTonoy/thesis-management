const mongoose = require('mongoose');

const progressReportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  thesisId: {
    type: String,
    required: true,
    default: 'THESIS-2026-001'
  },
  thesisTitle: {
    type: String,
    required: true
  },
  phase: {
    type: String,
    enum: ['p1', 'p2', 'defence'],
    required: true
  },
  phaseName: {
    type: String,
    enum: ['Pre-Thesis 1 (P1)', 'Pre-Thesis 2 (P2)', 'Thesis Defence Phase'],
    default: 'Pre-Thesis 1 (P1)'
  },
  description: {
    type: String,
    required: true
  },
  supportingDocuments: {
    type: String, // Link/URL or filename
    default: ''
  },
  marks: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  supervisorFeedback: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'evaluated'],
    default: 'submitted'
  }
}, { timestamps: true });

module.exports = mongoose.model('ProgressReport', progressReportSchema);
