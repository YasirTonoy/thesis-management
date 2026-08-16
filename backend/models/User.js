const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    studentId: { type: String, trim: true, unique: true, sparse: true },
    department: { type: String, required: [true, 'Department is required'], trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: [6, 'Password must be at least 6 characters'] },
    role: { type: String, enum: ['student', 'supervisor', 'admin'], default: 'student' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
