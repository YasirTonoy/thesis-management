const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const ALLOWED_SIGNUP_ROLES = ['student', 'supervisor'];

const registerUser = async (req, res) => {
  try {
    const { name, email, password, department, studentId, role } = req.body;
    const finalRole = ALLOWED_SIGNUP_ROLES.includes(role) ? role : 'student';

    if (!name || !email || !password || !department) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and department are required' });
    }

    if (finalRole === 'student' && !studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required for a student account' });
    }

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    if (finalRole === 'student' && studentId) {
      const idExists = await User.findOne({ studentId });
      if (idExists) {
        return res.status(400).json({ success: false, message: 'This Student ID is already registered' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name, email, password: hashedPassword, department,
      studentId: finalRole === 'student' ? studentId : undefined,
      role: finalRole
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

const getSupervisors = async (req, res) => {
  try {
    const supervisors = await User.find({ role: 'supervisor' }).select('name email department').sort({ name: 1 });
    res.json({ success: true, data: supervisors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email department studentId').sort({ name: 1 });
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const query = {};
    if (req.query.role) query.role = req.query.role;
    const users = await User.find(query).select('-password').sort({ name: 1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, department, studentId, researchInterests, bio, officeLocation, phone } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (department) user.department = department;
    if (user.role === 'student' && studentId) user.studentId = studentId;
    if (Array.isArray(researchInterests)) user.researchInterests = researchInterests;
    if (bio !== undefined) user.bio = bio;
    if (officeLocation !== undefined) user.officeLocation = officeLocation;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    const updated = await User.findById(user._id).select('-password');
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getSupervisors,
  getStudents,
  getAllUsers,
  updateProfile,
  updatePassword
};

