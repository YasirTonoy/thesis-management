const mongoose = require('mongoose');

const conferenceParticipationSchema = new mongoose.Schema(
  {
    proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    conferenceName: { type: String, required: [true, 'Conference name is required'], trim: true },
    paperTitle: { type: String, default: '', trim: true },
    role: { type: String, enum: ['presenter', 'co-author', 'attendee'], default: 'presenter' },
    location: { type: String, default: '', trim: true },
    date: { type: Date, required: [true, 'Conference date is required'] },
    notes: { type: String, default: '', trim: true },
    document: { filename: String, originalName: String, url: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ConferenceParticipation', conferenceParticipationSchema);
