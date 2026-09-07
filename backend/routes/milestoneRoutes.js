const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  createMilestone,
  getMilestones,
  submitMilestone,
  reviewMilestone,
  updateMilestone,
  deleteMilestone
} = require('../controllers/milestoneController');

// Supervisor & Admin routes
router.post('/', protect, roleCheck('supervisor', 'admin'), createMilestone);
router.put('/:id', protect, roleCheck('supervisor', 'admin'), updateMilestone);
router.put('/:id/review', protect, roleCheck('supervisor', 'admin'), reviewMilestone);
router.delete('/:id', protect, roleCheck('supervisor', 'admin'), deleteMilestone);

// Student routes
router.put('/:id/submit', protect, roleCheck('student'), submitMilestone);

// All authenticated users can view
router.get('/', protect, getMilestones);

module.exports = router;