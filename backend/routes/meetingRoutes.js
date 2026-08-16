const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  requestMeeting,
  getMeetings,
  respondToMeeting,
  cancelMeeting,
  completeMeeting
} = require('../controllers/meetingController');

// All authenticated users
router.post('/', protect, requestMeeting);
router.get('/', protect, getMeetings);
router.put('/:id/respond', protect, respondToMeeting);
router.put('/:id/cancel', protect, cancelMeeting);
router.put('/:id/complete', protect, completeMeeting);

module.exports = router;
