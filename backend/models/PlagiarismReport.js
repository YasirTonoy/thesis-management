const mongoose = require('mongoose');

const plagiarismReportSchema = new mongoose.Schema(
  {
    proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },
    thesisVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'ThesisVersion', default: null },
    toolName: { type: String, default: 'Turnitin', trim: true },
    similarityPercentage: {
      type: Number,
      required: [true, 'Similarity percentage is required'],
      min: [0, 'Similarity percentage cannot be below 0'],
      max: [100, 'Similarity percentage cannot exceed 100']
    },
    notes: { type: String, default: '', trim: true },
    report: {
      filename: String,
      originalName: String,
      url: String,
      size: Number
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    reviewComment: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

plagiarismReportSchema.index({ proposal: 1, createdAt: -1 });

module.exports = mongoose.model('PlagiarismReport', plagiarismReportSchema);
