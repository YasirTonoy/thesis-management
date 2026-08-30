const mongoose = require('mongoose');

const thesisVersionSchema = new mongoose.Schema(
  {
    proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },
    versionNumber: { type: Number, required: true },
    changeSummary: { type: String, required: [true, 'A change summary is required'], trim: true },
    file: {
      filename: String,
      originalName: String,
      url: String,
      size: Number
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isCurrent: { type: Boolean, default: false },
    reviewStatus: { type: String, enum: ['pending', 'approved', 'revision_required'], default: 'pending' },
    reviewComment: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

thesisVersionSchema.index({ proposal: 1, versionNumber: -1 });

module.exports = mongoose.model('ThesisVersion', thesisVersionSchema);
