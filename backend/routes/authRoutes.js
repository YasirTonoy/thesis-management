const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  registerUser,
  loginUser,
  getMe,
  getSupervisors,
  getStudents,
  getAllUsers,
  updateProfile,
  updatePassword
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.get('/supervisors', protect, getSupervisors);
router.get('/students', protect, getStudents);
router.get('/users', protect, getAllUsers);

module.exports = router;
