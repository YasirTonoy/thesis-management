const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' }
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: false } }
);

const thesisMaterialSchema = new mongoose.Schema(
  {
    proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },
    title: { type: String, required: [true, 'Material title is required'], trim: true },
    description: { type: String, default: '', trim: true },
    versions: { type: [versionSchema], validate: { validator: (arr) => arr.length >= 1, message: 'A material must have at least one version' } }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ThesisMaterial', thesisMaterialSchema);
