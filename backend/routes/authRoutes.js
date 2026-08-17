const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { registerUser, loginUser, getMe, getSupervisors } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/supervisors', protect, getSupervisors);

module.exports = router;
