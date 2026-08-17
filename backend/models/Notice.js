const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Notice title is required'], trim: true },
    content: { type: String, required: [true, 'Notice content is required'], trim: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notice', noticeSchema);
