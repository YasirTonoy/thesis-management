const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  submitProposal,
  getProposals,
  reviewProposal,
  updateProposal
} = require('../controllers/proposalController');

// Student routes
router.post('/', protect, roleCheck('student'), submitProposal);
router.put('/:id', protect, roleCheck('student'), updateProposal);

// Supervisor routes
router.put('/:id/review', protect, roleCheck('supervisor', 'admin'), reviewProposal);

// All authenticated users can view proposals (controller filters by role)
router.get('/', protect, getProposals);

module.exports = router;
