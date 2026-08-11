const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  createMilestone,
  getMilestones,
  submitMilestone,
  reviewMilestone,
  updateMilestone
} = require('../controllers/milestoneController');

// Supervisor routes
router.post('/', protect, roleCheck('supervisor'), createMilestone);
router.put('/:id', protect, roleCheck('supervisor'), updateMilestone);
router.put('/:id/review', protect, roleCheck('supervisor'), reviewMilestone);

// Student routes
router.put('/:id/submit', protect, roleCheck('student'), submitMilestone);

// All authenticated users can view
router.get('/', protect, getMilestones);

module.exports = router;