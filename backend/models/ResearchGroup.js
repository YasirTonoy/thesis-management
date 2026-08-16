const mongoose = require('mongoose');

const researchGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    researchArea: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now }
      }
    ],
    isOpen: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 20
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ResearchGroup', researchGroupSchema);
