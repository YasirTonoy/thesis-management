const mongoose = require('mongoose');

const finalSubmissionSchema = new mongoose.Schema(
  {
    proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true, unique: true },
    thesisVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'ThesisVersion', required: [true, 'A thesis version must be selected'] },
    plagiarismReport: { type: mongoose.Schema.Types.ObjectId, ref: 'PlagiarismReport', default: null },
    abstract: { type: String, required: [true, 'An abstract is required'], trim: true },
    keywords: { type: [String], default: [] },
    declarationAccepted: {
      type: Boolean,
      required: true,
      validate: { validator: (v) => v === true, message: 'The originality declaration must be accepted' }
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['submitted', 'accepted', 'returned'], default: 'submitted' },
    reviewComment: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FinalSubmission', finalSubmissionSchema);
