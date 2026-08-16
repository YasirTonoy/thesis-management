const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  version: {
    type: Number,
    required: true
  },
  documentUrl: {
    type: String,
    required: true
  },
  changeNotes: {
    type: String,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedByName: {
    type: String,
    required: true
  },
  updatedByRole: {
    type: String,
    enum: ['student', 'supervisor', 'admin'],
    default: 'student'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const thesisMaterialSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal'
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['dataset', 'supporting_doc', 'code_repository', 'manuscript'],
    default: 'supporting_doc'
  },
  description: {
    type: String,
    default: ''
  },
  currentVersion: {
    type: Number,
    default: 1
  },
  history: [versionSchema]
}, { timestamps: true });

module.exports = mongoose.model('ThesisMaterial', thesisMaterialSchema);
