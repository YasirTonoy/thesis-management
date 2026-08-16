const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Student name is required'], trim: true },
    studentId: { type: String, required: [true, 'Student ID is required'], trim: true }
  },
  { _id: false }
);

const proposalSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Proposal title is required'], trim: true },
    description: { type: String, default: '', trim: true },
    supervisor: { type: String, required: [true, 'Supervisor name is required'], trim: true },
    coSupervisor: { type: String, default: '', trim: true },
    students: {
      type: [groupMemberSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 1 && arr.length <= 5,
        message: 'A proposal must have between 1 and 5 students'
      },
      required: true
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    feedback: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Proposal', proposalSchema);
