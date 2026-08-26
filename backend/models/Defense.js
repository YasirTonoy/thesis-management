const mongoose = require('mongoose');

const examinerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['chair', 'internal', 'external'], default: 'internal' },
    invitationStatus: { type: String, enum: ['invited', 'accepted', 'declined'], default: 'invited' },
    responseNote: { type: String, default: '' },
    respondedAt: { type: Date }
  },
  { _id: false }
);

const defenseSchema = new mongoose.Schema(
  {
    proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true, unique: true },
    finalSubmission: { type: mongoose.Schema.Types.ObjectId, ref: 'FinalSubmission', default: null },
    scheduledAt: { type: Date, required: [true, 'A defense date and time is required'] },
    durationMinutes: { type: Number, default: 60, min: [15, 'Duration must be at least 15 minutes'] },
    mode: { type: String, enum: ['onsite', 'online'], default: 'onsite' },
    venue: { type: String, default: '', trim: true },
    meetingLink: { type: String, default: '', trim: true },
    examiners: {
      type: [examinerSchema],
      validate: { validator: (arr) => Array.isArray(arr) && arr.length >= 1, message: 'At least one examiner must be assigned' }
    },
    scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    notes: { type: String, default: '', trim: true },
    outcome: { type: String, enum: ['pending', 'pass', 'pass_with_corrections', 'fail'], default: 'pending' },
    resultComment: { type: String, default: '' },
    resultRecordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resultRecordedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Defense', defenseSchema);
