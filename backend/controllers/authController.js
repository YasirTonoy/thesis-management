const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, department, studentId } = req.body;
    // Public signup always creates a student account — supervisor/admin
    // accounts are provisioned separately, never via user-supplied input.
    const role = 'student';

    if (!name || !email || !password || !department) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and department are required' });
    }

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    if (studentId) {
      const idExists = await User.findOne({ studentId });
      if (idExists) {
        return res.status(400).json({ success: false, message: 'This Student ID is already registered' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name, email, password: hashedPassword, department,
      studentId: studentId || undefined,
      role: role || 'student'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id, name: user.name, email: user.email, role: user.role,
        department: user.department, studentId: user.studentId,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((val) => val.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An account with this email or Student ID already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        data: {
          _id: user._id, name: user.name, email: user.email, role: user.role,
          department: user.department, studentId: user.studentId,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerUser, loginUser, getMe };
